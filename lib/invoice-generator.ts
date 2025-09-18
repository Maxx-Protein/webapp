import PDFDocument from 'pdfkit'
import { formatCurrency, formatDate } from './utils-enhanced'
import type { Report, Payment, UserProfile } from '@/types'

interface InvoiceData {
  report: Report
  payment: Payment
  user: UserProfile
  invoiceNumber: string
  companyDetails: {
    name: string
    address: string[]
    email: string
    phone: string
    gstin?: string
  }
}

export class InvoiceGenerator {
  private doc: PDFKit.PDFDocument
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.doc = new PDFDocument({ size: 'A4', margin: 50 })
    this.pageWidth = 595.28
    this.pageHeight = 841.89
    this.margin = 50
  }

  async generateInvoice(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const buffers: Buffer[] = []

        this.doc.on('data', (chunk) => {
          buffers.push(chunk)
        })

        this.doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers)
          resolve(pdfBuffer)
        })

        this.doc.on('error', (error) => {
          reject(error)
        })

        // Generate invoice content
        this.addHeader(data.companyDetails)
        this.addInvoiceDetails(data.invoiceNumber, data.payment.created_at)
        this.addBillingDetails(data.user)
        this.addReportDetails(data.report)
        this.addPaymentDetails(data.payment)
        this.addFooter(data.companyDetails)

        this.doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  private addHeader(companyDetails: InvoiceData['companyDetails']) {
    // Company logo placeholder
    this.doc
      .rect(this.margin, this.margin, 100, 60)
      .stroke()
      .fontSize(10)
      .text('COMPANY', this.margin + 35, this.margin + 25)
      .text('LOGO', this.margin + 38, this.margin + 35)

    // Company details
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(companyDetails.name, this.margin + 120, this.margin)
      
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(companyDetails.address.join(', '), this.margin + 120, this.margin + 25)
      .text(`Email: ${companyDetails.email}`, this.margin + 120, this.margin + 40)
      .text(`Phone: ${companyDetails.phone}`, this.margin + 120, this.margin + 55)

    if (companyDetails.gstin) {
      this.doc.text(`GSTIN: ${companyDetails.gstin}`, this.margin + 120, this.margin + 70)
    }

    // INVOICE title
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', this.pageWidth - 150, this.margin, { align: 'right' })

    // Add a line separator
    this.doc
      .moveTo(this.margin, this.margin + 100)
      .lineTo(this.pageWidth - this.margin, this.margin + 100)
      .stroke()
  }

  private addInvoiceDetails(invoiceNumber: string, date: string) {
    const startY = this.margin + 120

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Invoice Number:', this.pageWidth - 200, startY)
      .font('Helvetica')
      .text(invoiceNumber, this.pageWidth - 200, startY + 15)

    this.doc
      .font('Helvetica-Bold')
      .text('Invoice Date:', this.pageWidth - 200, startY + 35)
      .font('Helvetica')
      .text(formatDate(date), this.pageWidth - 200, startY + 50)

    this.doc
      .font('Helvetica-Bold')
      .text('Payment Status:', this.pageWidth - 200, startY + 70)
      .font('Helvetica')
      .fillColor('green')
      .text('PAID', this.pageWidth - 200, startY + 85)
      .fillColor('black')
  }

  private addBillingDetails(user: UserProfile) {
    const startY = this.margin + 120

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Bill To:', this.margin, startY)

    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text(user.full_name, this.margin, startY + 20)
      .text(user.email, this.margin, startY + 35)

    if (user.phone) {
      this.doc.text(user.phone, this.margin, startY + 50)
    }
  }

  private addReportDetails(report: Report) {
    const startY = this.margin + 240

    // Table header
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Report Details', this.margin, startY)

    // Table
    const tableTop = startY + 25
    const col1X = this.margin
    const col2X = this.margin + 150
    const col3X = this.margin + 300
    const col4X = this.margin + 400

    // Header row
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', col1X, tableTop)
      .text('Report Date', col2X, tableTop)
      .text('File Name', col3X, tableTop)
      .text('Amount', col4X, tableTop)

    // Header line
    this.doc
      .moveTo(this.margin, tableTop + 15)
      .lineTo(this.pageWidth - this.margin, tableTop + 15)
      .stroke()

    // Data row
    const rowY = tableTop + 25
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text('Report Processing Fee', col1X, rowY)
      .text(formatDate(report.report_date), col2X, rowY)
      .text(report.filename, col3X, rowY, { width: 90, ellipsis: true })
      .text(formatCurrency(report.total_amount), col4X, rowY)

    // Table border
    this.doc
      .rect(this.margin, tableTop - 10, this.pageWidth - 2 * this.margin, 55)
      .stroke()
  }

  private addPaymentDetails(payment: Payment) {
    const startY = this.margin + 320

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Payment Details', this.margin, startY)

    const detailsY = startY + 25
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Payment Method:', this.margin, detailsY)
      .font('Helvetica')
      .text(this.formatPaymentMethod(payment.payment_method), this.margin + 100, detailsY)

    if (payment.transaction_id) {
      this.doc
        .font('Helvetica-Bold')
        .text('Transaction ID:', this.margin, detailsY + 20)
        .font('Helvetica')
        .text(payment.transaction_id, this.margin + 100, detailsY + 20)
    }

    this.doc
      .font('Helvetica-Bold')
      .text('Payment Date:', this.margin, detailsY + 40)
      .font('Helvetica')
      .text(formatDate(payment.created_at), this.margin + 100, detailsY + 40)

    // Total amount box
    const totalBoxY = startY + 100
    this.doc
      .rect(this.pageWidth - 200, totalBoxY, 150, 80)
      .stroke()

    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Total Amount', this.pageWidth - 190, totalBoxY + 15)
      .fontSize(18)
      .fillColor('blue')
      .text(formatCurrency(payment.amount), this.pageWidth - 190, totalBoxY + 40)
      .fillColor('black')

    // Amount in words
    this.doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text(`Amount in words: ${this.numberToWords(payment.amount)} Rupees Only`, 
            this.margin, totalBoxY + 100, { width: 300 })
  }

  private addFooter(companyDetails: InvoiceData['companyDetails']) {
    const footerY = this.pageHeight - 150

    // Terms and conditions
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Terms & Conditions:', this.margin, footerY)
      .font('Helvetica')
      .text('1. This is a computer-generated invoice.', this.margin, footerY + 15)
      .text('2. Payment is processed securely through our platform.', this.margin, footerY + 30)
      .text('3. For any queries, contact us at ' + companyDetails.email, this.margin, footerY + 45)

    // Signature section
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Authorized Signatory', this.pageWidth - 150, footerY + 30)

    // Footer line
    this.doc
      .moveTo(this.margin, this.pageHeight - 80)
      .lineTo(this.pageWidth - this.margin, this.pageHeight - 80)
      .stroke()

    // Footer text
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .text('Thank you for your business!', this.margin, this.pageHeight - 60, { 
        align: 'center',
        width: this.pageWidth - 2 * this.margin 
      })
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'credit_card': 'Credit Card',
      'upi': 'UPI Payment',
      'net_banking': 'Net Banking',
      'offline': 'Offline Payment'
    }
    return methods[method] || method.toUpperCase()
  }

  private numberToWords(amount: number): string {
    // Simplified number to words conversion for Indian format
    if (amount === 0) return 'Zero'
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const thousands = ['', 'Thousand', 'Lakh', 'Crore']

    const convertHundreds = (num: number): string => {
      let result = ''
      if (num > 99) {
        result += ones[Math.floor(num / 100)] + ' Hundred '
        num %= 100
      }
      if (num > 19) {
        result += tens[Math.floor(num / 10)] + ' '
        num %= 10
      } else if (num > 9) {
        result += teens[num - 10] + ' '
        return result
      }
      if (num > 0) {
        result += ones[num] + ' '
      }
      return result
    }

    const integerPart = Math.floor(amount)
    const decimalPart = Math.round((amount - integerPart) * 100)

    let words = ''
    let groupIndex = 0
    let tempAmount = integerPart

    if (tempAmount === 0) {
      words = 'Zero '
    } else {
      while (tempAmount > 0) {
        let group
        if (groupIndex === 0) {
          group = tempAmount % 1000
          tempAmount = Math.floor(tempAmount / 1000)
        } else if (groupIndex === 1) {
          group = tempAmount % 100
          tempAmount = Math.floor(tempAmount / 100)
        } else {
          group = tempAmount % 100
          tempAmount = Math.floor(tempAmount / 100)
        }

        if (group !== 0) {
          const groupWords = convertHundreds(group)
          words = groupWords + thousands[groupIndex] + ' ' + words
        }
        groupIndex++
      }
    }

    if (decimalPart > 0) {
      words += 'and ' + convertHundreds(decimalPart) + 'Paise '
    }

    return words.trim()
  }
}

// Default company details - can be configured
export const DEFAULT_COMPANY_DETAILS = {
  name: 'Report Processing Solutions',
  address: [
    '123 Business Park',
    'Mumbai, Maharashtra - 400001',
    'India'
  ],
  email: 'billing@reportprocessing.com',
  phone: '+91-22-1234-5678',
  gstin: '27ABCDE1234F1Z5'
}

// Generate invoice number
export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `INV${year}${month}${timestamp}`
}