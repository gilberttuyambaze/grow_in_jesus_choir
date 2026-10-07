'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { saveOnboardingProgress } from '@/lib/db'
import { getWorkspaceTourSteps, WORKSPACE_TOUR_ID, WORKSPACE_TOUR_VERSION } from './config'

export async function saveWorkspaceTourProgressAction(currentStep: number, completed = false) {
  const session = await getSessionUser()
  if (!session) return { success: false, error: 'Your session has expired. Sign in again.' }

  const steps = getWorkspaceTourSteps(session.role)
  if (!Number.isInteger(currentStep) || currentStep < 0 || currentStep >= steps.length) {
    return { success: false, error: 'That tour step is not valid.' }
  }
  if (completed && currentStep !== steps.length - 1) {
    return { success: false, error: 'Complete the final tour step before finishing.' }
  }

  try {
    await saveOnboardingProgress(
      session.userId,
      WORKSPACE_TOUR_ID,
      WORKSPACE_TOUR_VERSION,
      currentStep,
      completed ? 'completed' : 'in_progress'
    )
  } catch {
    return { success: false, error: 'Tour progress could not be saved. Please try again.' }
  }

  if (completed) revalidatePath('/settings')
  return { success: true }
}
