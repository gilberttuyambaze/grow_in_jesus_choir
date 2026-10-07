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
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Private document storage is not configured.')
  }
  const localDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname)
  if (parsedUrl.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && localDevelopmentHost)) {
    throw new Error('Private document storage requires HTTPS.')
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

async function requirePrivateBucket(): Promise<void> {
  const { bucket } = getStorageConfig()
  const { data, error } = await getSupabaseClient().storage.getBucket(bucket)
  if (error || !data || data.public) {
    throw new Error('Configured document storage bucket must exist and be private.')
  }
}

export async function uploadToStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ success: true; path: string }> {
  const { bucket } = getStorageConfig()
  await requirePrivateBucket()
  const { data, error } = await getSupabaseClient().storage.from(bucket).upload(filename, buffer, {
    contentType: mimeType,
    upsert: false
  })
  if (error || !data) throw new Error('Document upload failed.')
  return { success: true, path: data.path }
}

export async function downloadFromStorage(filename: string): Promise<Buffer | null> {
  const { bucket } = getStorageConfig()
  await requirePrivateBucket()
  const { data, error } = await getSupabaseClient().storage.from(bucket).download(filename)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

export async function removeFromStorage(filename: string): Promise<void> {
  const { bucket } = getStorageConfig()
  await requirePrivateBucket()
  const { error } = await getSupabaseClient().storage.from(bucket).remove([filename])
  if (error) throw new Error('Uploaded document cleanup failed.')
}
