import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import formidable from 'formidable'
import path from 'path'
import fs from 'fs/promises'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface PaymentProofData {
  reportId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs')
    await fs.mkdir(uploadDir, { recursive: true })

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        return `${Date.now()}_${part.originalFilename}`
      },
      filter: (part) => {
        // Only allow PDF and image files
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        return allowedTypes.includes(part.mimetype || '')
      }
    })

    const [fields, files] = await form.parse(req)
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
    const reportId = Array.isArray(fields.reportId) ? fields.reportId[0] : fields.reportId

    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    if (!reportId) {
      return res.status(400).json({ success: false, message: 'Report ID is required' })
    }

    // Verify the report belongs to the user
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, status, payment_status')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    // Get the file URL relative to public
    const fileName = path.basename(uploadedFile.filepath)
    const fileUrl = `/uploads/payment-proofs/${fileName}`

    const paymentProofData: PaymentProofData = {
      reportId: report.id,
      fileName: uploadedFile.originalFilename || fileName,
      fileUrl,
      fileType: path.extname(uploadedFile.originalFilename || '').toLowerCase(),
      fileSize: uploadedFile.size
    }

    // Save payment proof record to reports table for now
    // (since payment_proofs table may not exist)
    const { error: proofError } = await supabaseAdmin
      .from('reports')
      .update({
        payment_method: 'offline',
        payment_proof_url: paymentProofData.fileUrl,
        payment_proof_status: 'pending',
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (proofError) {
      console.error('Payment proof update error:', proofError)
      console.error('Error details:', {
        code: proofError.code,
        details: proofError.details,
        hint: proofError.hint,
        message: proofError.message
      })
      return res.status(500).json({
        success: false,
        message: `Failed to save payment proof: ${proofError.message}`
      })
    }

    // Skip report history insertion since table may not exist
    // Add to report history
    // await supabaseAdmin
    //   .from('report_history')
    //   .insert({
    //     report_id: reportId,
    //     action: 'payment_proof_uploaded',
    //     new_status: 'pending_approval',
    //     comments: 'Payment proof uploaded for offline payment',
    //     performed_by: user.id
    //   })

    // Create notification for managers
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('role', ['admin', 'manager'])

    if (managers && managers.length > 0) {
      const notifications = managers.map(manager => ({
        user_id: manager.id,
        type: 'payment_proof_uploaded',
        title: 'New Payment Proof Uploaded',
        message: `User ${user.fullName} has uploaded payment proof for a report.`,
        data: {
          reportId: reportId,
          userId: user.id,
          userName: user.fullName
        }
      }))

      await supabaseAdmin
        .from('notifications')
        .insert(notifications)
    }

    console.log('Payment proof uploaded successfully:', {
      reportId: reportId,
      fileName: paymentProofData.fileName,
      fileUrl: paymentProofData.fileUrl
    })

    return res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        fileUrl: paymentProofData.fileUrl,
        fileName: paymentProofData.fileName,
        status: 'pending'
      }
    })

  } catch (error: unknown) {
    console.error('Payment proof upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Payment proof upload failed'
    const errorStack = error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: errorStack
    })
  }
}