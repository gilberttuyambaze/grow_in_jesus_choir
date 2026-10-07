'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { markNotificationAsRead } from '@/lib/db'

export async function markNotificationReadAction(id: string) {
  const session = await getSessionUser()
  if (!session) return { success: false, error: 'Your session has expired.' }

  try {
    await markNotificationAsRead(id, session.userId)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Could not update notification.' }
  }
}
