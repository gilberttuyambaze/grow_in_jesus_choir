'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUserByEmail, getUserById } from '@/lib/db'
import { setSession, clearSession } from '@/lib/auth/session'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { success: false, error: 'Please enter your email address' }
  }

  const user = await getUserByEmail(email.trim())
  if (!user) {
    return { success: false, error: 'No account found with this email' }
  }

  await setSession(user)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function switchRoleAction(role: 'LEADER' | 'MEMBER') {
  const targetEmail = role === 'LEADER' ? 'sarah@growinjesus.rw' : 'john@growinjesus.rw'
  const user = await getUserByEmail(targetEmail)
  if (!user) {
    return { success: false, error: 'Target demo account not found' }
  }

  await setSession(user)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logoutAction() {
  await clearSession()
  revalidatePath('/', 'layout')
  redirect('/login')
}

