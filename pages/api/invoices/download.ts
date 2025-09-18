import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const { invoiceId } = req.query

    if (!invoiceId || typeof invoiceId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      })
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      })
    }

    // Verify user access
    if (invoice.user_id !== decoded.userId) {
      // Check if user is manager/admin
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', decoded.userId)
        .single()

      if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        })
      }
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), 'public', invoice.file_path)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      })
    }

    // Read and return the file
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = `Invoice-${invoice.invoice_number}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    return res.status(200).send(fileBuffer)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Invoice download error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}