'use server'

import { revalidatePath } from 'next/cache'
import { markNotificationAsRead } from '@/lib/db'

export async function markNotificationReadAction(id: string) {
  try {
    await markNotificationAsRead(id)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

