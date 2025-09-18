// Core Types and Interfaces for Production-Grade Report System

export type UserRole = 'admin' | 'manager' | 'user'

export type ReportStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'approved' 
  | 'rejected' 
  | 'paid' 
  | 'failed'

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded'
  | 'partial'

export type PaymentMethod = 
  | 'credit_card' 
  | 'upi' 
  | 'net_banking' 
  | 'offline'

export type PaymentProofStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected'

export type FileType = 'html' | 'csv' | 'pdf' | 'jpg' | 'jpeg' | 'png'

export type NotificationType = 
  | 'report_approved' 
  | 'report_rejected' 
  | 'payment_approved' 
  | 'payment_rejected' 
  | 'proof_required' 
  | 'payment_reminder'

// User Management
export interface User {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_at: string
}

// File Processing
export interface ExtractedFile {
  name: string
  type: FileType
  content?: string
  amounts?: number[]
  totalAmount?: number
  hasRequiredColumn?: boolean
  columnFound?: string
}

export interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  url?: string
  error?: string
  extractedFiles?: ExtractedFile[]
  calculatedAmount?: number
  hasValidColumns?: boolean
}

export interface FileValidationResult {
  isValid: boolean
  hasRequiredColumn: boolean
  columnName?: string
  rowCount?: number
  errors: string[]
  warnings: string[]
}

// Reports
export interface Report {
  id: string
  user_id: string
  title?: string
  description?: string
  category?: string
  filename: string
  report_date: string
  upload_date: string
  total_amount: number
  remaining_amount: number
  status: ReportStatus
  file_path: string
  file_urls: string[]
  processing_details: ProcessingDetails
  manager_comments?: string
  rejection_reason?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface ProcessingDetails {
  extractedFiles: ExtractedFile[]
  fileDetails: UploadedFile[]
  calculatedAmounts: number[]
  submittedAt: string
  submittedBy: string
  validationResults?: FileValidationResult[]
  columnValidation?: {
    [filename: string]: {
      hasRequiredColumn: boolean
      columnName?: string
      rowCount?: number
    }
  }
}

export interface ReportFormData {
  title: string
  description: string
  category: string
  reportDate: string
  files: UploadedFile[]
}

// Payments
export interface Payment {
  id: string
  user_id: string
  report_id: string
  amount: number
  remaining_amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_id?: string
  payment_date?: string
  gateway_response?: Record<string, unknown>
  created_at: string
  updated_at: string
  report?: Report
  user?: UserProfile
  payment_proofs?: PaymentProof[]
}

export interface PaymentProof {
  id: string
  payment_id: string
  report_id: string
  user_id: string
  file_url: string
  file_type: FileType
  amount: number
  notes?: string
  status: PaymentProofStatus
  uploaded_at: string
  approved_by?: string
  approved_at?: string
  manager_comments?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface PaymentRequest {
  reportId: string
  amount: number
  paymentMethod: PaymentMethod
  notes?: string
}

export interface PartialPaymentRecord {
  id: string
  payment_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  transaction_id?: string
  proof_url?: string
  status: PaymentStatus
  created_at: string
}

// Comments & Communication
export interface Comment {
  id: string
  report_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  is_manager_comment: boolean
  is_internal: boolean
  attachments?: string[]
  created_at: string
  updated_at: string
  user?: UserProfile
  replies?: Comment[]
}

export interface CommentThread {
  reportId: string
  comments: Comment[]
  unreadCount: number
}

// Notifications
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  email_sent: boolean
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  report_approvals: boolean
  payment_updates: boolean
  proof_requests: boolean
  reminders: boolean
  updated_at: string
}

// Dashboard & Analytics
export interface DashboardStats {
  totalReports: number
  pendingApproval: number
  approved: number
  rejected: number
  totalAmount: number
  paidAmount: number
  pendingPayment: number
  partialPayments: number
  thisMonthReports: number
  thisMonthAmount: number
}

export interface ManagerStats {
  pendingReports: number
  pendingPaymentProofs: number
  totalReportsToday: number
  totalAmountToday: number
  averageApprovalTime: number
  rejectionRate: number
}

export interface PaymentStats {
  totalProcessed: number
  pendingAmount: number
  completedAmount: number
  refundedAmount: number
  averageAmount: number
  paymentMethodBreakdown: {
    [method in PaymentMethod]: number
  }
}

// Audit & Activity
export interface ActivityLog {
  id: string
  user_id: string
  action: string
  entity_type: 'report' | 'payment' | 'user' | 'system'
  entity_id?: string
  details: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: UserProfile
}

export interface AuditTrail {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  changed_by: string
  changed_at: string
}

// Invoice & Documents
export interface Invoice {
  id: string
  payment_id: string
  report_id: string
  user_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  tax_amount: number
  total_amount: number
  currency: 'INR'
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  pdf_url?: string
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface InvoiceData {
  invoice: Invoice
  lineItems: InvoiceLineItem[]
  company: CompanyInfo
  customer: UserProfile
}

export interface CompanyInfo {
  name: string
  address: string
  city: string
  state: string
  pincode: string
  gstin?: string
  email: string
  phone: string
  website?: string
}

// API Response Types
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Search & Filter Types
export interface SearchFilters {
  query?: string
  status?: ReportStatus[]
  paymentStatus?: PaymentStatus[]
  paymentMethod?: PaymentMethod[]
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  userId?: string
  category?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone?: string
}

export interface ResetPasswordForm {
  email: string
}

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// UI State Types
export interface LoadingStates {
  [key: string]: boolean
}

export interface ErrorStates {
  [key: string]: string | null
}

export interface FormErrors {
  [field: string]: string[]
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Constants
export const SUPPORTED_FILE_TYPES = {
  reports: ['.html', '.csv'],
  proofs: ['.pdf', '.jpg', '.jpeg', '.png']
} as const

export const PAYMENT_METHODS = {
  credit_card: 'Credit Card',
  upi: 'UPI',
  net_banking: 'Net Banking',
  offline: 'Offline Payment'
} as const

export const REPORT_STATUSES = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  failed: 'Failed'
} as const

export const PAYMENT_STATUSES = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
  partial: 'Partial'
} as const

// Currency formatting for Indian Rupee
export const CURRENCY_CONFIG = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN'
} as const