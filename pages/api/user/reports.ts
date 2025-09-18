import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify user token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'user') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    const { title, description, category, priority, expectedAmount, dueDate, files } = req.body

    // Validate required fields
    if (!title || !description || !category || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and at least one file are required'
      })
    }

    // Create report record
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        title,
        description,
        category,
        priority: priority || 'medium',
        expected_amount: expectedAmount || 0,
        due_date: dueDate || null,
        user_id: user.id,
        status: 'submitted',
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

    // Create file records
    const fileRecords = files.map((file: any) => ({
      report_id: report.id,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: file.url,
      uploaded_at: new Date().toISOString()
    }))

    const { error: filesError } = await supabaseAdmin
      .from('report_files')
      .insert(fileRecords)

    if (filesError) {
      console.error('Files creation error:', filesError)
      // Clean up report if file creation fails
      await supabaseAdmin.from('reports').delete().eq('id', report.id)
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save file records'
      })
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
