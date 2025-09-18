import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface SubmittedFile {
  name: string
  url?: string
  extractedFiles?: Record<string, unknown>[]
  calculatedAmount?: number
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

    const { 
      files, 
      totalAmount,
      reportDate
    } = req.body

    // Validate required fields
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Files are required'
      })
    }

    if (!reportDate) {
      return res.status(400).json({
        success: false,
        message: 'Report date is required'
      })
    }

    // Create report record
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: user.id,
        filename: files[0]?.name || 'report_file',
        report_date: reportDate || new Date().toISOString().split('T')[0], // Use provided date or current date
        file_path: files[0]?.url || null,
        total_amount: totalAmount || 0,
        status: 'pending', // Manager approval is independent of payment
        processing_details: {
          extractedFiles: files.map((f: SubmittedFile) => f.extractedFiles).flat(),
          fileDetails: files,
          calculatedAmounts: files.map((f: SubmittedFile) => f.calculatedAmount),
          submittedAt: new Date().toISOString(),
          submittedBy: user.id,
          paymentFlow: 'independent' // Track that this uses the new flow
        },
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report creation error:', reportError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create report'
      })
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'Report uploaded and ready for payment',
        details: {
          reportId: report.id,
          totalAmount,
          reportDate: reportDate || new Date().toISOString().split('T')[0],
          paymentFlow: 'independent',
          approvalFlow: 'parallel'
        }
      })

    return res.status(200).json({
      success: true,
      message: 'Report uploaded successfully and ready for payment',
      reportId: report.id
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Report submission error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}