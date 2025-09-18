import * as cheerio from 'cheerio'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: {
    name: string
    size: number
    type: string
    extension: string
  }
  contentValidation?: {
    hasValidStructure: boolean
    foundColumns: string[]
    extractedDataCount: number
    potentialAmountColumns: string[]
  }
}

export interface FileValidationOptions {
  maxFileSize?: number // in bytes
  allowedExtensions?: string[]
  requireAmountColumn?: boolean
  minDataRows?: number
  maxFiles?: number
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.html', '.htm', '.csv'],
  requireAmountColumn: true,
  minDataRows: 1,
  maxFiles: 10
}

export class FileValidator {
  private options: FileValidationOptions

  constructor(options: Partial<FileValidationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  // Validate multiple files
  async validateFiles(files: File[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    // Check total number of files
    if (files.length > (this.options.maxFiles || 10)) {
      // Return error for all files
      return files.map(file => ({
        isValid: false,
        errors: [`Maximum ${this.options.maxFiles} files allowed. You selected ${files.length} files.`],
        warnings: [],
        fileInfo: this.getFileInfo(file)
      }))
    }

    // Validate each file
    for (const file of files) {
      const result = await this.validateSingleFile(file)
      results.push(result)
    }

    return results
  }

  // Validate a single file
  async validateSingleFile(file: File): Promise<ValidationResult> {
    const fileInfo = this.getFileInfo(file)
    const errors: string[] = []
    const warnings: string[] = []

    // Basic file validation
    this.validateFileBasics(file, errors, warnings)

    // If basic validation fails, return early
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        fileInfo
      }
    }

    // Content validation
    let contentValidation
    try {
      contentValidation = await this.validateFileContent(file)
      
      if (this.options.requireAmountColumn && contentValidation.potentialAmountColumns.length === 0) {
        errors.push('No amount columns found. Please ensure your file contains amount data.')
      }

      if (contentValidation.extractedDataCount < (this.options.minDataRows || 1)) {
        errors.push(`Insufficient data rows. Found ${contentValidation.extractedDataCount}, minimum ${this.options.minDataRows} required.`)
      }

      if (!contentValidation.hasValidStructure) {
        warnings.push('File structure may not be optimal for data extraction.')
      }

    } catch (error) {
      errors.push(`Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo,
      contentValidation
    }
  }

  private validateFileBasics(file: File, errors: string[], warnings: string[]): void {
    // File size validation
    if (file.size > (this.options.maxFileSize || 50 * 1024 * 1024)) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.options.maxFileSize || 50 * 1024 * 1024)})`)
    }

    // File type validation
    const extension = this.getFileExtension(file.name)
    if (!this.options.allowedExtensions?.includes(extension)) {
      errors.push(`File type '${extension}' is not allowed. Allowed types: ${this.options.allowedExtensions?.join(', ')}`)
    }

    // Empty file check
    if (file.size === 0) {
      errors.push('File is empty')
    }

    // File name validation
    if (!file.name || file.name.trim() === '') {
      errors.push('File name is invalid')
    }

    // Check for potentially problematic file names
    const fileName = file.name.toLowerCase()
    if (fileName.includes('temp') || fileName.includes('tmp')) {
      warnings.push('File appears to be a temporary file')
    }

    if (fileName.length > 255) {
      warnings.push('File name is very long and may cause issues')
    }
  }

  private async validateFileContent(file: File): Promise<ValidationResult['contentValidation']> {
    const extension = this.getFileExtension(file.name)
    const content = await this.readFileContent(file)

    if (extension === '.csv') {
      return this.validateCSVContent(content)
    } else if (['.html', '.htm'].includes(extension)) {
      return this.validateHTMLContent(content)
    }

    throw new Error(`Unsupported file type for content validation: ${extension}`)
  }

  private validateCSVContent(content: string): ValidationResult['contentValidation'] {
    const lines = content.split('\n').filter(line => line.trim() !== '')
    
    if (lines.length < 2) {
      return {
        hasValidStructure: false,
        foundColumns: [],
        extractedDataCount: 0,
        potentialAmountColumns: []
      }
    }

    // Parse header row
    const headerLine = lines[0]
    const columns = this.parseCSVLine(headerLine)
    
    // Look for amount-related columns
    const potentialAmountColumns = this.findAmountColumns(columns)
    
    // Count data rows (excluding header)
    const dataRowCount = lines.length - 1

    return {
      hasValidStructure: columns.length > 0 && dataRowCount > 0,
      foundColumns: columns,
      extractedDataCount: dataRowCount,
      potentialAmountColumns
    }
  }

  private validateHTMLContent(content: string): ValidationResult['contentValidation'] {
    try {
      const $ = cheerio.load(content)
      
      // Check for table structures
      const tables = $('table')
      if (tables.length === 0) {
        return {
          hasValidStructure: false,
          foundColumns: [],
          extractedDataCount: 0,
          potentialAmountColumns: []
        }
      }

      const foundColumns: string[] = []
      const potentialAmountColumns: string[] = []
      let totalDataRows = 0

      tables.each((_, table) => {
        // Find headers
        const headers = $(table).find('th, thead td')
        headers.each((_, header) => {
          const headerText = $(header).text().trim()
          if (headerText) {
            foundColumns.push(headerText)
            if (this.isAmountColumn(headerText)) {
              potentialAmountColumns.push(headerText)
            }
          }
        })

        // Count data rows
        const dataRows = $(table).find('tbody tr, tr').not(':has(th)')
        totalDataRows += dataRows.length
      })

      return {
        hasValidStructure: foundColumns.length > 0 && totalDataRows > 0,
        foundColumns: [...new Set(foundColumns)], // Remove duplicates
        extractedDataCount: totalDataRows,
        potentialAmountColumns: [...new Set(potentialAmountColumns)]
      }

    } catch (error) {
      throw new Error('Invalid HTML structure')
    }
  }

  private findAmountColumns(columns: string[]): string[] {
    return columns.filter(column => this.isAmountColumn(column))
  }

  private isAmountColumn(columnName: string): boolean {
    const normalizedName = columnName.toLowerCase().replace(/[^a-z]/g, '')
    
    const amountPatterns = [
      'totalamountcharged',
      'totalamount',
      'amount',
      'charged',
      'total',
      'cost',
      'price',
      'fee',
      'charge',
      'sum',
      'value',
      'payment'
    ]

    return amountPatterns.some(pattern => 
      normalizedName.includes(pattern) || 
      normalizedName === pattern
    )
  }

  private parseCSVLine(line: string): string[] {
    // Simple CSV parser - could be enhanced for more complex CSV formats
    const columns: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    columns.push(current.trim())
    return columns.map(col => col.replace(/^"|"$/g, '')) // Remove surrounding quotes
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file content'))
      }
      
      reader.readAsText(file)
    })
  }

  private getFileInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      extension: this.getFileExtension(file.name)
    }
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.')
    return lastDotIndex >= 0 ? fileName.substring(lastDotIndex).toLowerCase() : ''
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export default instance
export const defaultFileValidator = new FileValidator()

// Utility functions
export function validateFiles(files: File[], options?: Partial<FileValidationOptions>): Promise<ValidationResult[]> {
  const validator = new FileValidator(options)
  return validator.validateFiles(files)
}

export function validateSingleFile(file: File, options?: Partial<FileValidationOptions>): Promise<ValidationResult> {
  const validator = new FileValidator(options)
  return validator.validateSingleFile(file)
}