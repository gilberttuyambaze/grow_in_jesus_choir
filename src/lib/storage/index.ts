/**
 * Supabase Storage Client for Financial Documents & Receipts
 * Interacts with private Supabase Storage bucket 'grow-in-jesus-choir'
 * with local disk fallback for offline resilience.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aqakudlnbjfglffimjbt.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'grow-in-jesus-choir'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
    return supabaseInstance
  } catch (err) {
    console.error('[Storage] Error initializing Supabase client:', err)
    return null
  }
}

/**
 * Uploads a document/receipt to Supabase Storage.
 */
export async function uploadToStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; path: string; error?: string }> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: true
        })

      if (!error && data) {
        return { success: true, path: data.path }
      }
      console.warn('[Storage] Supabase upload error:', error?.message)
    } catch (err: any) {
      console.warn('[Storage] Supabase upload failed, falling back to local storage:', err.message)
    }
  }

  // Resilient fallback to secure local storage path
  try {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    const targetPath = path.join(uploadDir, filename)
    fs.writeFileSync(targetPath, buffer)
    return { success: true, path: targetPath }
  } catch (err: any) {
    return { success: false, path: '', error: err.message }
  }
}

/**
 * Downloads a document/receipt from Supabase Storage.
 */
export async function downloadFromStorage(filename: string): Promise<Buffer | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filename)

      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
    } catch (err: any) {
      console.warn('[Storage] Supabase download failed, checking local storage:', err.message)
    }
  }

  // Fallback to local storage if available
  try {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads')
    const localPath = path.join(uploadDir, filename)
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath)
    }
  } catch (err) {
    // ignore
  }

  return null
}

