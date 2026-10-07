import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs'
import { getSessionUser } from '@/lib/auth/session'
import { createDocument, createAuditLog } from '@/lib/db'
import { uploadToStorage } from '@/lib/storage'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const recordId = (formData.get('recordId') as string) || null
    const notes = (formData.get('notes') as string) || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPEG, PNG, WEBP, and PDF files are permitted.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds the maximum permitted size of 50 MB.' },
        { status: 400 }
      )
    }

    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const sanitizedFilename = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage (grow-in-jesus-choir bucket)
    const uploadResult = await uploadToStorage(sanitizedFilename, buffer, file.type)
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || 'Failed to upload document to storage' }, { status: 500 })
    }

    const doc = await createDocument({
      filename: sanitizedFilename,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      recordId,
      uploadedById: session.userId,
      notes
    })

    await createAuditLog({
      actorId: session.userId,
      actorName: session.fullName,
      action: 'DOCUMENT_UPLOADED',
      targetType: 'document',
      targetId: doc.id,
      details: {
        filename: file.name,
        sizeBytes: file.size,
        recordId,
        storagePath: uploadResult.path
      }
    })

    return NextResponse.json({ success: true, document: doc })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 })
  }
}
