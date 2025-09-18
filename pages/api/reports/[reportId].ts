import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)
    const { reportId } = req.query

    console.log('API [reportId] - Request details:', {
      reportId,
      userId: user.id,
      userRole: user.role,
      query: req.query
    })

    if (!reportId || typeof reportId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      })
    }

    // Fetch report details
    console.log('Fetching report with ID:', reportId, 'for user:', user.id)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    console.log('Supabase query result:', { report, reportError })

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    // Check permissions
    if (user.role === 'user' && report.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    return res.status(200).json({
      success: true,
      report: {
        id: report.id,
        filename: report.filename,
        total_amount: report.total_amount,
        report_date: report.report_date,
        status: report.status,
        payment_status: report.payment_status,
        created_at: report.created_at,
        user_id: report.user_id
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Report fetch error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}