import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { canViewAllFinances } from '@/lib/permissions'
import { getSessionUser } from '@/lib/auth/session'
import { createDocument, getFinancialRecordById, getMemberByUserId } from '@/lib/db'
import { removeFromStorage, uploadToStorage } from '@/lib/storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
}

function matchesFileSignature(mimeType: string, bytes: Buffer): boolean {
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mimeType === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (mimeType === 'application/pdf') return bytes.toString('ascii', 0, 5) === '%PDF-'
  return false
}

export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'AUDITOR') return NextResponse.json({ error: 'This account has read-only access.' }, { status: 403 })

  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE + 1024 * 1024) {
    return NextResponse.json({ error: 'Document exceeds the 50 MB upload limit.' }, { status: 413 })
  }

  let storedFilename: string | null = null
  try {
    const formData = await request.formData()
    const entry = formData.get('file')
    const file = entry instanceof File ? entry : null
    const recordId = typeof formData.get('recordId') === 'string'
      ? (formData.get('recordId') as string).trim() || null
      : null
    const notes = typeof formData.get('notes') === 'string'
      ? (formData.get('notes') as string).trim().slice(0, 2000) || null
      : null

    if (!file || file.size <= 0) {
      return NextResponse.json({ error: 'Choose a document to upload.' }, { status: 400 })
    }
    if (!MIME_EXTENSIONS[file.type]) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WEBP, and PDF documents are accepted.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Document exceeds the 50 MB upload limit.' }, { status: 413 })
    }

    if (recordId) {
      const record = await getFinancialRecordById(recordId)
      if (!record) return NextResponse.json({ error: 'Financial record not found.' }, { status: 404 })
      if (!canViewAllFinances(session.role)) {
        const member = await getMemberByUserId(session.userId)
        if (!member || record.memberId !== member.id) {
          return NextResponse.json({ error: 'You cannot attach a document to this record.' }, { status: 403 })
        }
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!matchesFileSignature(file.type, bytes)) {
      return NextResponse.json({ error: 'The file contents do not match the selected file type.' }, { status: 400 })
    }

    const filename = `${crypto.randomUUID()}${MIME_EXTENSIONS[file.type]}`
    await uploadToStorage(filename, bytes, file.type)
    storedFilename = filename

    const doc = await createDocument({
      filename,
      originalName: file.name.slice(0, 255),
      mimeType: file.type,
      sizeBytes: file.size,
      recordId,
      uploadedById: session.userId,
      uploadedByName: session.fullName,
      notes
    })

    return NextResponse.json({ success: true, document: doc }, { status: 201 })
  } catch {
    if (storedFilename) {
      try {
        await removeFromStorage(storedFilename)
      } catch {
        // The upload request still fails closed if remote cleanup is unavailable.
      }
    }
    return NextResponse.json({ error: 'Document upload failed.' }, { status: 500 })
  }
}
