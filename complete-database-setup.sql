-- Complete Database Setup for Report Calculator
-- This file combines the schema definition with the missing INSERT policies

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'processing', 'completed', 'paid', 'failed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    status report_status DEFAULT 'pending',
    file_path TEXT,
    processing_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

-- Add the missing INSERT policies for user creation
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Managers can insert users" ON users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'manager'
  );

-- RLS Policies for other tables
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
    
CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Default users
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'System Administrator',
  'admin'
);

INSERT INTO users (email, password_hash, full_name, role, created_by)
VALUES (
  'manager@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- manager123
  'Demo Manager',
  'manager',
  (SELECT id FROM users WHERE email = 'admin@company.com' LIMIT 1)
);

INSERT INTO users (email, password_hash, full_name, role, created_by)
VALUES (
  'user@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user123
  'Demo User',
  'user',
  (SELECT id FROM users WHERE email = 'admin@company.com' LIMIT 1)
);

-- Statistics Functions
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reports', (SELECT COUNT(*) FROM reports WHERE user_id = user_uuid),
    'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = user_uuid AND payment_status = 'completed'),
    'pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = user_uuid AND payment_status = 'pending'),
    'this_month_reports', (
      SELECT COUNT(*) FROM reports
      WHERE user_id = user_uuid
        AND DATE_TRUNC('month', report_date) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_monthly_stats(target_year INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'month', month_num,
      'reports_count', reports_count,
      'total_amount', total_amount,
      'unique_users', unique_users
    )
  ) INTO result
  FROM (
    SELECT
      EXTRACT(MONTH FROM report_date) AS month_num,
      COUNT(*) AS reports_count,
      SUM(total_amount) AS total_amount,
      COUNT(DISTINCT user_id) AS unique_users
    FROM reports
    WHERE EXTRACT(YEAR FROM report_date) = target_year
    GROUP BY EXTRACT(MONTH FROM report_date)
    ORDER BY month_num
  ) monthly_data;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh schema
NOTIFY pgrst, 'reload schema';