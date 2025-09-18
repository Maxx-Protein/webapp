import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { InvoiceGenerator, DEFAULT_COMPANY_DETAILS, generateInvoiceNumber } from '@/lib/invoice-generator'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { paymentId } = req.body

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      })
    }

    // Get payment details with related data
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        reports:report_id (
          id,
          filename,
          report_date,
          total_amount,
          created_at
        ),
        users:user_id (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('id', paymentId)
      .eq('payment_status', 'completed')
      .single()

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not completed'
      })
    }

    // Verify user access
    if (payment.user_id !== decoded.userId) {
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

    // Check if invoice already exists
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, file_path')
      .eq('payment_id', paymentId)
      .single()

    if (existingInvoice) {
      // Return existing invoice
      const invoicePath = path.join(process.cwd(), 'public', existingInvoice.file_path)
      if (fs.existsSync(invoicePath)) {
        const fileBuffer = fs.readFileSync(invoicePath)
        
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${existingInvoice.invoice_number}.pdf"`)
        return res.status(200).send(fileBuffer)
      }
    }

    // Generate new invoice
    const invoiceNumber = generateInvoiceNumber()
    const invoiceGenerator = new InvoiceGenerator()

    const invoiceData = {
      report: payment.reports as any,
      payment: payment,
      user: payment.users as any,
      invoiceNumber,
      companyDetails: DEFAULT_COMPANY_DETAILS
    }

    const pdfBuffer = await invoiceGenerator.generateInvoice(invoiceData)

    // Save invoice to file system
    const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true })
    }

    const fileName = `Invoice-${invoiceNumber}.pdf`
    const filePath = path.join(invoicesDir, fileName)
    fs.writeFileSync(filePath, pdfBuffer)

    // Save invoice record to database
    const { error: invoiceInsertError } = await supabaseAdmin
      .from('invoices')
      .insert({
        payment_id: paymentId,
        user_id: payment.user_id,
        report_id: payment.report_id,
        invoice_number: invoiceNumber,
        file_path: `invoices/${fileName}`,
        amount: payment.amount,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (invoiceInsertError) {
      console.error('Invoice record creation error:', invoiceInsertError)
      // Continue even if database insert fails
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: `Invoice generated: ${invoiceNumber}`,
        entity_type: 'payment',
        entity_id: paymentId,
        details: {
          paymentId,
          invoiceNumber,
          amount: payment.amount
        }
      })

    // Return the PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    return res.status(200).send(pdfBuffer)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Invoice generation error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}