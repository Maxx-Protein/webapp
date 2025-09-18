-- Add missing payment columns to reports table
-- Run this in your Supabase SQL Editor

-- Add payment-related columns if they don't exist
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online',
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_status VARCHAR(20) DEFAULT 'pending';

-- Update existing reports to have default values
UPDATE reports 
SET payment_method = 'online'
WHERE payment_method IS NULL;

UPDATE reports 
SET payment_proof_status = 'pending'
WHERE payment_proof_status IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reports_payment_method ON reports(payment_method);
CREATE INDEX IF NOT EXISTS idx_reports_payment_proof_status ON reports(payment_proof_status);