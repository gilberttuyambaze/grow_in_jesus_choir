'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Check, LoaderCircle, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { FinancialCategory, FinancialRecordType } from '@/types'
import { useToast } from '@/components/ui/Toast'
import {
  deleteFinancialCategoryAction,
  restoreFinancialCategoryAction,
  saveFinancialCategoryAction
} from '@/features/finances/category-actions'

interface FinancialCategoryManagerProps {
  categories: FinancialCategory[]
  canManage: boolean
}

export function FinancialCategoryManager({ categories: initialCategories, canManage }: FinancialCategoryManagerProps) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()
  const [categories, setCategories] = React.useState(initialCategories)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<FinancialCategory | null>(null)
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<FinancialRecordType>('income')
  const [description, setDescription] = React.useState('')
  const [pendingKey, setPendingKey] = React.useState<string | null>(null)
  const actionLock = React.useRef(false)

  React.useEffect(() => setCategories(initialCategories), [initialCategories])

  const activeCategories = categories.filter((category) => category.isActive)
  const archivedCategories = categories.filter((category) => !category.isActive)
  const incomeCategories = activeCategories.filter((category) => category.type === 'income')
  const expenseCategories = activeCategories.filter((category) => category.type === 'expense')

  const resetForm = () => {
    setIsFormOpen(false)
    setEditing(null)
    setName('')
    setType('income')
    setDescription('')
  }

  const startCreate = (categoryType: FinancialRecordType = 'income') => {
    setEditing(null)
    setName('')
    setType(categoryType)
    setDescription('')
    setIsFormOpen(true)
  }

  const startEdit = (category: FinancialCategory) => {
    setEditing(category)
    setName(category.name)
    setType(category.type)
    setDescription(category.description || '')
    setIsFormOpen(true)
  }

  const perform = async (key: string, action: () => Promise<{ success: boolean; error?: string; message?: string }>) => {
    if (actionLock.current) return
    actionLock.current = true
    setPendingKey(key)
    try {
      const result = await action()
      if (!result.success) {
        toastError('Category update failed', result.error || 'Please try again.')
        return false
      }
      toastSuccess('Categories updated', result.message || 'Your changes have been saved.')
      router.refresh()
      return true
    } catch {
      toastError('Category update failed', 'Please try again.')
      return false
    } finally {
      actionLock.current = false
      setPendingKey(null)
    }
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData()
    if (editing) formData.set('id', editing.id)
    formData.set('name', name)
    formData.set('type', type)
    formData.set('description', description)
    const saved = await perform('save', () => saveFinancialCategoryAction(formData))
    if (saved) resetForm()
  }

  const handleDelete = async (category: FinancialCategory) => {
    if (!window.confirm(`Delete “${category.name}”? Categories used in records or sessions will be archived to preserve history.`)) return
    await perform(`delete:${category.id}`, () => deleteFinancialCategoryAction(category.id))
  }

  const handleRestore = async (category: FinancialCategory) => {
    await perform(`restore:${category.id}`, () => restoreFinancialCategoryAction(category.id))
  }

  const categoryList = (title: string, items: FinancialCategory[], categoryType: FinancialRecordType) => (
    <div className="min-w-0 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title} ({items.length})
        </span>
        {canManage && (
          <button
            type="button"
            onClick={() => startCreate(categoryType)}
            disabled={pendingKey !== null}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.map((category) => (
            <div key={category.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800">{category.name}</span>
                {category.description && <span className="mt-0.5 block truncate text-[10px] text-slate-500">{category.description}</span>}
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    disabled={pendingKey !== null}
                    aria-label={`Edit ${category.name}`}
                    title="Edit category"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-indigo-700 disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category)}
                    disabled={pendingKey !== null}
                    aria-label={`Delete ${category.name}`}
                    title="Delete or archive category"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-rose-600 disabled:opacity-50"
                  >
                    {pendingKey === `delete:${category.id}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">No categories yet.</p>
      )}
    </div>
  )

  return (
    <section className="card-surface min-w-0 space-y-5 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
            <Archive className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Configured Financial Categories</h2>
            <p className="text-[11px] text-slate-400">
              {canManage ? 'Manage categories used to classify income and expenses.' : 'Categories used to classify income and expenses.'}
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => startCreate()}
            disabled={pendingKey !== null}
            className="brand-button inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
        )}
      </div>

      {isFormOpen && canManage && (
        <form onSubmit={(event) => void handleSave(event)} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-800">{editing ? 'Edit category' : 'Add category'}</h3>
            <button type="button" onClick={resetForm} disabled={pendingKey !== null} aria-label="Close category form" className="rounded-lg p-1 text-slate-500 hover:bg-white disabled:opacity-50">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="category-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Name</label>
              <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </div>
            <div>
              <label htmlFor="category-type" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Type</label>
              <select id="category-type" value={type} onChange={(event) => setType(event.target.value as FinancialRecordType)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label htmlFor="category-description" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Description (optional)</label>
              <input id="category-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} disabled={pendingKey !== null} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={pendingKey !== null} aria-busy={pendingKey === 'save'} className="brand-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-50">
              {pendingKey === 'save' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {pendingKey === 'save' ? 'Saving…' : 'Save category'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 pt-1 md:grid-cols-2">
        {categoryList('Income streams', incomeCategories, 'income')}
        {categoryList('Expense categories', expenseCategories, 'expense')}
      </div>

      {canManage && archivedCategories.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Archived categories ({archivedCategories.length})</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {archivedCategories.map((category) => (
              <div key={category.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-700">{category.name}</span>
                  <span className="text-[10px] capitalize text-slate-500">{category.type} · archived</span>
                </div>
                <button type="button" onClick={() => void handleRestore(category)} disabled={pendingKey !== null} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-indigo-700 hover:bg-white disabled:opacity-50">
                  {pendingKey === `restore:${category.id}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
