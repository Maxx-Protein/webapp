import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'
import Papa from 'papaparse'
import * as cheerio from 'cheerio'

interface ExtractedFile {
  name: string
  type: 'html' | 'csv' | 'other'
  content?: string
  amounts?: number[]
  totalAmount?: number
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

    const { fileUrl, fileName } = req.body

    if (!fileUrl || !fileName) {
      return res.status(400).json({ 
        success: false, 
        message: 'File URL and name are required' 
      })
    }

    console.log('Processing file:', { fileUrl, fileName })

    // Get the actual file path
    const filePath = path.join(process.cwd(), 'public', fileUrl)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    let extractedFiles: ExtractedFile[] = []

    try {
      // Handle HTML and CSV files directly
      const fileContent = fs.readFileSync(filePath, 'utf8')
      
      if (fileName.toLowerCase().endsWith('.csv')) {
        const amounts = parseCSVAmounts(fileContent)
        extractedFiles.push({
          name: fileName,
          type: 'csv',
          content: fileContent.substring(0, 500) + '...',
          amounts,
          totalAmount: amounts.reduce((sum, amount) => sum + amount, 0)
        })
      } else if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
        const amounts = parseHTMLAmounts(fileContent)
        extractedFiles.push({
          name: fileName,
          type: 'html',
          content: fileContent.substring(0, 500) + '...',
          amounts,
          totalAmount: amounts.reduce((sum, amount) => sum + amount, 0)
        })
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Please upload HTML or CSV files only.'
        })
      }
    } catch (processingError) {
      console.error('File processing error:', processingError)
      return res.status(500).json({
        success: false,
        message: 'Failed to process file. Please ensure it is a valid HTML or CSV file.'
      })
    }

    // Calculate total amount from all extracted files
    const totalAmount = extractedFiles.reduce((sum, file) => sum + (file.totalAmount || 0), 0)

    console.log('Processing complete:', { 
      extractedFilesCount: extractedFiles.length, 
      totalAmount,
      files: extractedFiles.map(f => ({ name: f.name, type: f.type, amount: f.totalAmount }))
    })

    return res.status(200).json({
      success: true,
      extractedFiles,
      totalAmount
    })

  } catch (error: any) {
    console.error('Processing error:', error)
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Processing failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

function parseCSVAmounts(csvContent: string): number[] {
  const amounts: number[] = []
  
  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    })

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors)
    }

    const data = result.data as any[]
    
    // Primary target column - exact match first
    const primaryColumn = 'TOTAL_AMOUNT_CHARGED'
    
    // Fallback columns if primary not found
    const fallbackColumns = [
      'Total_Charged_Amount', 
      'TOTAL_CHARGED_AMOUNT',
      'total_amount_charged',
      'Total Amount Charged',
      'TOTAL AMOUNT CHARGED',
      'TotalAmountCharged',
      'total_charged_amount'
    ]

    let targetColumn = ''
    
    // Find the correct column name
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      console.log('CSV Headers found:', headers)
      
      // Check for exact primary column match first
      if (headers.includes(primaryColumn)) {
        targetColumn = primaryColumn
      } else {
        // Try fallback columns
        for (const col of fallbackColumns) {
          if (headers.includes(col)) {
            targetColumn = col
            break
          }
        }
        
        // If still no match, try case-insensitive fuzzy search
        if (!targetColumn) {
          for (const header of headers) {
            const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '')
            if (normalizedHeader.includes('totalamountcharged') || 
                (normalizedHeader.includes('total') && normalizedHeader.includes('amount') && normalizedHeader.includes('charged'))) {
              targetColumn = header
              break
            }
          }
        }
      }
    }

    console.log('Using column for amounts:', targetColumn)

    if (targetColumn) {
      for (const row of data) {
        const value = row[targetColumn]
        if (value !== undefined && value !== null && value !== '') {
          // Enhanced number parsing to handle various formats
          const cleanValue = String(value)
            .replace(/[^\d.-]/g, '') // Remove all non-numeric except decimal and minus
            .replace(/^-+/, '-') // Ensure only one minus sign at start
            .replace(/-+$/, '') // Remove trailing minus signs
          
          const numValue = parseFloat(cleanValue)
          if (!isNaN(numValue) && numValue > 0) {
            amounts.push(numValue)
          }
        }
      }
    } else {
      console.warn('No suitable amount column found in CSV. Available headers:', Object.keys(data[0] || {}))
    }

    console.log('CSV amounts extracted:', amounts.length, 'total:', amounts.reduce((a, b) => a + b, 0))
    
  } catch (error) {
    console.error('CSV parsing error:', error)
  }

  return amounts
}

function parseHTMLAmounts(htmlContent: string): number[] {
  const amounts: number[] = []
  
  try {
    const $ = cheerio.load(htmlContent)
    
    // Strategy 1: Find column by header text "Total amount charged"
    let targetColumnIndex = -1
    
    $('table').each((tableIndex, table) => {
      // Find header row and locate "Total amount charged" column
      const headerRow = $(table).find('thead tr').first()
      if (headerRow.length === 0) {
        // If no thead, try first row
        const firstRow = $(table).find('tr').first()
        firstRow.find('th, td').each((index, cell) => {
          const headerText = $(cell).text().trim().toLowerCase()
          if (headerText.includes('total amount charged') || 
              headerText.includes('totalamountcharged') ||
              (headerText.includes('total') && headerText.includes('amount') && headerText.includes('charged'))) {
            targetColumnIndex = index
            console.log('Found target column at index:', index, 'with header:', $(cell).text())
            return false // Break the loop
          }
        })
      } else {
        headerRow.find('th, td').each((index, cell) => {
          const headerText = $(cell).text().trim().toLowerCase()
          if (headerText.includes('total amount charged') || 
              headerText.includes('totalamountcharged') ||
              (headerText.includes('total') && headerText.includes('amount') && headerText.includes('charged'))) {
            targetColumnIndex = index
            console.log('Found target column at index:', index, 'with header:', $(cell).text())
            return false // Break the loop
          }
        })
      }
      
      // Extract amounts from the identified column
      if (targetColumnIndex >= 0) {
        const dataRows = $(table).find('tbody tr')
        if (dataRows.length === 0) {
          // If no tbody, use all rows except first (header)
          $(table).find('tr').slice(1).each((rowIndex, row) => {
            const cell = $(row).find('td, th').eq(targetColumnIndex)
            const text = cell.text().trim()
            const cleanValue = text.replace(/[^\d.-]/g, '')
            const value = parseFloat(cleanValue)
            if (!isNaN(value) && value > 0) {
              amounts.push(value)
            }
          })
        } else {
          dataRows.each((rowIndex, row) => {
            const cell = $(row).find('td').eq(targetColumnIndex)
            const text = cell.text().trim()
            const cleanValue = text.replace(/[^\d.-]/g, '')
            const value = parseFloat(cleanValue)
            if (!isNaN(value) && value > 0) {
              amounts.push(value)
            }
          })
        }
      }
    })

    // Strategy 2: If no column found by header, try pattern matching in cells
    if (amounts.length === 0) {
      console.log('No column found by header, trying pattern matching...')
      
      $('td, th').each((index, element) => {
        const text = $(element).text().trim()
        
        // Look for numeric values that could be amounts
        const amountMatch = text.match(/^\d+(?:\.\d{1,2})?$/)
        if (amountMatch) {
          const value = parseFloat(text)
          if (!isNaN(value) && value > 0) {
            // Check if this cell is in a context that suggests it's an amount
            const cellIndex = $(element).index()
            const row = $(element).closest('tr')
            const table = $(element).closest('table')
            
            // Look for header indicators
            const headerRow = table.find('tr').first()
            const headerCell = headerRow.find('th, td').eq(cellIndex)
            const headerText = headerCell.text().toLowerCase()
            
            if (headerText.includes('total') || headerText.includes('amount') || headerText.includes('charged')) {
              amounts.push(value)
            }
          }
        }
      })
    }

    console.log('HTML amounts extracted:', amounts.length, 'total:', amounts.reduce((a, b) => a + b, 0))
    
  } catch (error) {
    console.error('HTML parsing error:', error)
  }

  return amounts
}