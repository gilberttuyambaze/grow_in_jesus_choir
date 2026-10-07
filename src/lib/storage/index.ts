import 'server-only'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getStorageConfig() {
  const url = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim()
  if (!url || !serviceRoleKey || !bucket) {
    throw new Error('Private document storage is not configured.')
  }
  return { url, serviceRoleKey, bucket }
}

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance
  const { url, serviceRoleKey } = getStorageConfig()
  supabaseInstance = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  return supabaseInstance
}

export async function uploadToStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ success: true; path: string }> {
  const { bucket } = getStorageConfig()
  const { data, error } = await getSupabaseClient().storage.from(bucket).upload(filename, buffer, {
    contentType: mimeType,
    upsert: false
  })
  if (error || !data) throw new Error('Document upload failed.')
  return { success: true, path: data.path }
}

export async function downloadFromStorage(filename: string): Promise<Buffer | null> {
  const { bucket } = getStorageConfig()
  const { data, error } = await getSupabaseClient().storage.from(bucket).download(filename)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

export async function removeFromStorage(filename: string): Promise<void> {
  const { bucket } = getStorageConfig()
  const { error } = await getSupabaseClient().storage.from(bucket).remove([filename])
  if (error) throw new Error('Uploaded document cleanup failed.')
}
