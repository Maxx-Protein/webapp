import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

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

    const { userId, type, title, message, data, sendEmail = false } = req.body

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, type, title, and message are required'
      })
    }

    // Verify the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
        email_sent: sendEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Notification creation error:', notificationError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create notification'
      })
    }

    // Send email notification if requested
    if (sendEmail) {
      try {
        await sendEmailNotification(user, { type, title, message, data })
      } catch (emailError) {
        console.error('Email notification error:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: `Notification sent: ${title}`,
        entity_type: 'notification',
        entity_id: notification.id,
        details: {
          notificationId: notification.id,
          recipientId: userId,
          type,
          title
        }
      })

    return res.status(200).json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Send notification error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}

// Email notification function (placeholder - implement with your email service)
async function sendEmailNotification(
  user: { email: string; full_name: string },
  notification: { type: string; title: string; message: string; data?: any }
) {
  // This is a placeholder for email sending functionality
  // In a real application, you would integrate with services like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend
  // - Postmark
  
  console.log('Email notification would be sent:', {
    to: user.email,
    subject: notification.title,
    content: notification.message,
    user: user.full_name,
    type: notification.type
  })

  // Example implementation with nodemailer (uncomment if you have email service configured):
  /*
  const nodemailer = require('nodemailer')
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: notification.title,
    html: generateEmailTemplate(user, notification)
  }

  await transporter.sendMail(mailOptions)
  */
}

// Email template generator (placeholder)
function generateEmailTemplate(
  user: { full_name: string },
  notification: { title: string; message: string; type: string; data?: any }
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Report Processing System</h1>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p>Dear ${user.full_name},</p>
        <p>${notification.message}</p>
        
        ${notification.type === 'report_approved' ? `
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Your report has been approved!</strong> You can now proceed with payment.
          </div>
        ` : ''}
        
        ${notification.type === 'payment_completed' ? `
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Payment completed successfully!</strong> Your invoice will be generated automatically.
          </div>
        ` : ''}
        
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from Report Processing System. 
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `
}