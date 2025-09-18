-- Enhanced Production-Grade Database Schema
-- This file contains all the new tables and updates for the complete system

-- Update existing enums to support new features
DROP TYPE IF EXISTS report_status CASCADE;
CREATE TYPE report_status AS ENUM (
  'pending', 
  'processing', 
  'completed', 
  'approved', 
  'rejected', 
  'paid', 
  'failed'
);

DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM (
  'pending', 
  'processing', 
  'completed', 
  'failed', 
  'refunded',
  'partial'
);

CREATE TYPE payment_method AS ENUM (
  'credit_card',
  'upi', 
  'net_banking',
  'offline'
);

CREATE TYPE payment_proof_status AS ENUM (
  'pending_approval',
  'approved', 
  'rejected'
);

CREATE TYPE notification_type AS ENUM (
  'report_approved',
  'report_rejected', 
  'payment_approved',
  'payment_rejected',
  'proof_required',
  'payment_reminder'
);

CREATE TYPE file_type AS ENUM (
  'html',
  'csv', 
  'pdf',
  'jpg',
  'jpeg',
  'png'
);

-- Update reports table with new fields
ALTER TABLE reports ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_urls TEXT[];
ALTER TABLE reports ADD COLUMN IF NOT EXISTS manager_comments TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Update reports status to use new enum
ALTER TABLE reports ALTER COLUMN status TYPE report_status USING status::text::report_status;

-- Update payments table with new fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;
ALTER TABLE payments ALTER COLUMN payment_method TYPE payment_method USING payment_method::text::payment_method;
ALTER TABLE payments ALTER COLUMN payment_status TYPE payment_status USING payment_status::text::payment_status;

-- Payment Proofs table for proof uploads
CREATE TABLE IF NOT EXISTS payment_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type file_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    status payment_proof_status DEFAULT 'pending_approval',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    manager_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Payments table for tracking multiple payments
CREATE TABLE IF NOT EXISTS partial_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    payment_method payment_method NOT NULL,
    transaction_id VARCHAR(100),
    proof_url TEXT,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table for communication threads
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_manager_comment BOOLEAN DEFAULT FALSE,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    report_approvals BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    proof_requests BOOLEAN DEFAULT TRUE,
    reminders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'draft',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail table for complete activity tracking
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Information table
CREATE TABLE IF NOT EXISTS company_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Upload Sessions for tracking upload progress
CREATE TABLE IF NOT EXISTS file_upload_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    total_files INTEGER NOT NULL,
    completed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_size BIGINT NOT NULL,
    uploaded_size BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_proofs_payment_id ON payment_proofs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_report_id ON payment_proofs(report_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_user_id ON payment_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);

CREATE INDEX IF NOT EXISTS idx_partial_payments_payment_id ON partial_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_date ON partial_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_comments_report_id ON comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_report_id ON invoices(report_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record ON audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_by ON audit_trail(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON audit_trail(changed_at);

CREATE INDEX IF NOT EXISTS idx_file_upload_sessions_user ON file_upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_sessions_session ON file_upload_sessions(session_id);

-- Row Level Security for new tables
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_upload_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view own payment proofs" ON payment_proofs
  FOR SELECT USING (auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can insert own payment proofs" ON payment_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update payment proofs" ON payment_proofs
  FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can view own partial payments" ON partial_payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM payments WHERE id = payment_id) OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Users can view report comments" ON comments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
    auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins can view all audit trail" ON audit_trail
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view own file upload sessions" ON file_upload_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own file upload sessions" ON file_upload_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Insert default company information
INSERT INTO company_info (name, address, city, state, pincode, email, phone, website)
VALUES (
  'Report Processing Company',
  '123 Business District, Tech Park',
  'Mumbai',
  'Maharashtra',
  '400001',
  'admin@reportcompany.com',
  '+91-9876543210',
  'https://reportcompany.com'
) ON CONFLICT DO NOTHING;

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Functions for enhanced statistics and reporting

-- Function to get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_comprehensive_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'reports', json_build_object(
      'total', (SELECT COUNT(*) FROM reports WHERE user_id = user_uuid),
      'pending', (SELECT COUNT(*) FROM reports WHERE user_id = user_uuid AND status = 'pending'),
      'approved', (SELECT COUNT(*) FROM reports WHERE user_id = user_uuid AND status = 'approved'),
      'rejected', (SELECT COUNT(*) FROM reports WHERE user_id = user_uuid AND status = 'rejected'),
      'this_month', (
        SELECT COUNT(*) FROM reports
        WHERE user_id = user_uuid
          AND DATE_TRUNC('month', report_date) = DATE_TRUNC('month', CURRENT_DATE)
      )
    ),
    'payments', json_build_object(
      'total_amount', (
        SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE user_id = user_uuid AND payment_status = 'completed'
      ),
      'pending_amount', (
        SELECT COALESCE(SUM(remaining_amount), 0) FROM payments
        WHERE user_id = user_uuid AND payment_status IN ('pending', 'partial')
      ),
      'completed_payments', (
        SELECT COUNT(*) FROM payments
        WHERE user_id = user_uuid AND payment_status = 'completed'
      ),
      'pending_proofs', (
        SELECT COUNT(*) FROM payment_proofs
        WHERE user_id = user_uuid AND status = 'pending_approval'
      )
    ),
    'notifications', json_build_object(
      'unread_count', (
        SELECT COUNT(*) FROM notifications
        WHERE user_id = user_uuid AND read = FALSE
      ),
      'recent_count', (
        SELECT COUNT(*) FROM notifications
        WHERE user_id = user_uuid AND created_at > NOW() - INTERVAL '7 days'
      )
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get manager dashboard statistics
CREATE OR REPLACE FUNCTION get_manager_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
    'pending_payment_proofs', (SELECT COUNT(*) FROM payment_proofs WHERE status = 'pending_approval'),
    'today_submissions', (
      SELECT COUNT(*) FROM reports
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'today_amount', (
      SELECT COALESCE(SUM(total_amount), 0) FROM reports
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'this_week_approvals', (
      SELECT COUNT(*) FROM reports
      WHERE status IN ('approved', 'rejected')
        AND approved_at > NOW() - INTERVAL '7 days'
    ),
    'average_approval_time_hours', (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600), 0)
      FROM reports
      WHERE approved_at IS NOT NULL
        AND approved_at > NOW() - INTERVAL '30 days'
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for audit trail
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), COALESCE(auth.uid(), NEW.user_id));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), COALESCE(auth.uid(), NEW.user_id));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), COALESCE(auth.uid(), OLD.user_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
DROP TRIGGER IF EXISTS audit_reports ON reports;
CREATE TRIGGER audit_reports AFTER INSERT OR UPDATE OR DELETE ON reports
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_payment_proofs ON payment_proofs;
CREATE TRIGGER audit_payment_proofs AFTER INSERT OR UPDATE OR DELETE ON payment_proofs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Automatic invoice number generation function
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  month_part TEXT;
  sequence_part TEXT;
  last_sequence INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');
  month_part := TO_CHAR(NOW(), 'MM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 7) AS INTEGER)), 0) + 1
  INTO last_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV' || year_part || month_part || '%'
    AND created_at >= DATE_TRUNC('month', NOW());
  
  sequence_part := LPAD(last_sequence::TEXT, 4, '0');
  
  RETURN 'INV' || year_part || month_part || sequence_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;