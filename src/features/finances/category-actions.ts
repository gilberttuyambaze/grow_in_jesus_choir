'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canEditSettings } from '@/lib/permissions'
import {
  createFinancialCategory,
  deleteFinancialCategory,
  restoreFinancialCategory,
  updateFinancialCategory
} from '@/lib/db'
import { FinancialRecordType } from '@/types'

const safeErrors = new Set([
  'An active category with this name already exists for that type.',
  'Another active category already uses this name. Rename it before restoring.',
  'A category used by financial records or sessions cannot change type.',
  'Financial category not found.'
])

function reportError(error: unknown, fallback: string) {
  return error instanceof Error && safeErrors.has(error.message) ? error.message : fallback
}

function revalidateCategoryData() {
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/finances')
  revalidatePath('/reports')
  revalidatePath('/sessions', 'layout')
}

async function getManager() {
  const session = await getSessionUser()
  return session && canEditSettings(session.role) ? session : null
}

export async function saveFinancialCategoryAction(formData: FormData) {
  const session = await getManager()
  if (!session) return { success: false, error: 'Only choir leaders and admins can manage financial categories.' }

  const idValue = formData.get('id')
  const nameValue = formData.get('name')
  const typeValue = formData.get('type')
  const descriptionValue = formData.get('description')
  if (
    (idValue !== null && typeof idValue !== 'string') ||
    typeof nameValue !== 'string' ||
    typeof typeValue !== 'string' ||
    (descriptionValue !== null && typeof descriptionValue !== 'string')
  ) return { success: false, error: 'The category details are invalid.' }

  const id = typeof idValue === 'string' ? idValue.trim() : ''
  const name = nameValue.trim()
  const type = typeValue as FinancialRecordType
  const description = typeof descriptionValue === 'string' ? descriptionValue.trim() : ''
  if (
    (id && id.length > 100) ||
    !name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name) ||
    (type !== 'income' && type !== 'expense') ||
    description.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(description)
  ) return { success: false, error: 'Enter a category name up to 80 characters and a description up to 500 characters.' }

  const actor = { id: session.userId, name: session.fullName }
  try {
    const category = id
      ? await updateFinancialCategory(id, { name, type, description: description || null }, actor)
      : await createFinancialCategory({ name, type, description: description || null }, actor)
    revalidateCategoryData()
    return { success: true, message: id ? 'Category updated.' : 'Category created.', category }
  } catch (error) {
    return { success: false, error: reportError(error, 'Could not save this category. Please try again.') }
  }
}

export async function deleteFinancialCategoryAction(id: string) {
  const session = await getManager()
  if (!session) return { success: false, error: 'Only choir leaders and admins can manage financial categories.' }
  if (typeof id !== 'string' || !id.trim() || id.length > 100) {
    return { success: false, error: 'The selected category is invalid.' }
  }

  try {
    const result = await deleteFinancialCategory(id.trim(), { id: session.userId, name: session.fullName })
    revalidateCategoryData()
    return {
      success: true,
      message: result === 'archived'
        ? 'Category archived because it is used by existing financial records or sessions.'
        : 'Category deleted.'
    }
  } catch (error) {
    return { success: false, error: reportError(error, 'Could not delete this category. Please try again.') }
  }
}

export async function restoreFinancialCategoryAction(id: string) {
  const session = await getManager()
  if (!session) return { success: false, error: 'Only choir leaders and admins can manage financial categories.' }
  if (typeof id !== 'string' || !id.trim() || id.length > 100) {
    return { success: false, error: 'The selected category is invalid.' }
  }

  try {
    await restoreFinancialCategory(id.trim(), { id: session.userId, name: session.fullName })
    revalidateCategoryData()
    return { success: true, message: 'Category restored.' }
  } catch (error) {
    return { success: false, error: reportError(error, 'Could not restore this category. Please try again.') }
  }
}
