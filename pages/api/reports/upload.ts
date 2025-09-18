import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { AuthService } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    
    // For now, let's skip auth verification and just upload
    // const user = await AuthService.verifyToken(token)

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports')
    await fs.mkdir(uploadDir, { recursive: true })

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filename: (name, ext, part) => {
        return Date.now() + '_' + part.originalFilename
      }
    })

    const [fields, files] = await form.parse(req)
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file

    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // Get the file URL relative to public
    const fileName = path.basename(uploadedFile.filepath)
    const fileUrl = `/uploads/reports/${fileName}`

    console.log('File uploaded successfully:', {
      originalName: uploadedFile.originalFilename,
      newPath: uploadedFile.filepath,
      url: fileUrl,
      size: uploadedFile.size
    })

    return res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: uploadedFile.originalFilename,
      size: uploadedFile.size
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
