import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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
      title, 
      description, 
      category, 
      priority, 
      dueDate, 
      files, 
      totalAmount, 
      paymentId 
    } = req.body

    // Validate required fields
    if (!title || !description || !category || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and files are required'
      })
    }

    // Create report record using your existing schema
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: user.id,
        // Map to your existing columns
        filename: files[0]?.name || 'report_file', // Use first file name
        report_date: new Date().toISOString().split('T')[0], // Today's date
        file_path: files[0]?.url || null,
        total_amount: totalAmount || 0,
        // Use your existing processing_details jsonb column
        processing_details: {
          extractedFiles: files.map(f => f.extractedFiles).flat(),
          fileDetails: files,
          calculatedAmounts: files.map(f => f.calculatedAmount)
        },
        // New columns we added
        title,
        description,
        category,
        priority: priority || 'medium',
        due_date: dueDate || null,
        payment_id: paymentId,
        payment_status: 'completed',
        // Keep existing columns
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

    // Create individual file records
    if (files.length > 0) {
      const fileRecords = files.map((file: any) => ({
        report_id: report.id,
        file_name: file.name,
        file_size: 0, // You can add this to your upload
        file_type: file.name.split('.').pop() || 'unknown',
        file_url: file.url || '',
        extracted_files: file.extractedFiles || [],
        calculated_amount: file.calculatedAmount || 0
      }))

      const { error: filesError } = await supabaseAdmin
        .from('report_files')
        .insert(fileRecords)

      if (filesError) {
        console.error('Files creation error:', filesError)
      }
    }

    // Create payment record
    if (paymentId) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          report_id: report.id,
          user_id: user.id,
          payment_id: paymentId,
          amount: totalAmount,
          payment_method: 'card', // You can pass this from frontend
          payment_status: 'completed'
        })

      if (paymentError) {
        console.error('Payment creation error:', paymentError)
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id
    })

  } catch (error: any) {
    console.error('Report submission error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
}
