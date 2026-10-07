'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, X, ShieldAlert, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { FinancialCategory, Member, UserRole } from '@/types'
import { createRecordAction } from '@/features/finances/actions'
import { formatCurrency } from '@/lib/utils/currency'
import { getTodayISODate } from '@/lib/utils/date'

interface AddRecordDialogProps {
  isOpen: boolean
  onClose: () => void
  categories: FinancialCategory[]
  members: Member[]
  userRole: UserRole
  onSuccess?: () => void
}

export function AddRecordDialog({
  isOpen,
  onClose,
  categories,
  members,
  userRole,
  onSuccess
}: AddRecordDialogProps) {
  const [recordType, setRecordType] = React.useState<'income' | 'expense' | null>(null)
  const [amount, setAmount] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [memberId, setMemberId] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [recordDate, setRecordDate] = React.useState(getTodayISODate())
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successInfo, setSuccessInfo] = React.useState<{ amount: number; description: string; message: string } | null>(null)

  // Filter categories by type
  const availableCategories = React.useMemo(() => {
    if (!recordType) return []
    return categories.filter((c) => c.type === recordType)
  }, [categories, recordType])

  const handleReset = () => {
    setRecordType(null)
    setAmount('')
    setCategoryId('')
    setMemberId('')
    setDescription('')
    setRecordDate(getTodayISODate())
    setError(null)
    setSuccessInfo(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordType) return

    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    if (!description.trim()) {
      setError('Please provide a short description.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('type', recordType)
    formData.append('amount', parsedAmount.toString())
    formData.append('categoryId', categoryId)
    formData.append('recordDate', recordDate)
    formData.append('description', description.trim())
    if (memberId) formData.append('memberId', memberId)

    const result = await createRecordAction(formData)

    setIsSubmitting(false)

    if (result.success) {
      setSuccessInfo({
        amount: parsedAmount,
        description: description.trim(),
        message: result.message || 'Record successfully saved'
      })
      if (onSuccess) onSuccess()
    } else {
      setError(result.error || 'Failed to save record.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={
        successInfo
          ? 'Confirmation'
          : !recordType
          ? 'What would you like to record?'
          : recordType === 'income'
          ? 'Record Money Received'
          : 'Record Money Spent'
      }
      description={
        successInfo
          ? 'Your entry has been registered.'
          : !recordType
          ? 'Choose whether choir funds were received or spent.'
          : recordType === 'income'
          ? 'Contributions, gifts, and choir income.'
          : 'Transport, equipment, logistics, and choir expenses.'
      }
    >
      {/* SUCCESS CONFIRMATION STATE */}
      {successInfo ? (
        <div className="py-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>
          <p className="text-xs uppercase tracking-widest text-[#718079] font-bold">
            Record Saved
          </p>
          <h3 className="text-3xl font-serif font-medium text-[#213b31] my-2">
            {formatCurrency(successInfo.amount)}
          </h3>
          <p className="text-sm font-medium text-[#486357] mb-1">
            {successInfo.description}
          </p>
          <p className="text-xs text-[#718079] max-w-xs mx-auto mb-6 leading-relaxed">
            {successInfo.message}
          </p>

          <button
            onClick={handleClose}
            className="w-full py-3 px-5 rounded-xl bg-[#315b4d] hover:bg-[#274b3f] text-white font-medium text-sm transition-all shadow-md shadow-[#315b4d]/20"
          >
            Done
          </button>
        </div>
      ) : !recordType ? (
        /* STEP 1: CHOOSE TYPE */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          <button
            type="button"
            onClick={() => {
              setRecordType('income')
              setError(null)
            }}
            className="group p-5 rounded-2xl border border-[#dce6df] hover:border-[#86a895] bg-[#fafcfa] hover:bg-[#f3f8f4] text-left transition-all flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-[#e3efe6] text-[#3d7751] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <strong className="block text-base text-[#213b31] font-semibold mb-1">
                Money Received
              </strong>
              <span className="text-xs text-[#718079] leading-relaxed block">
                Contributions, donations, events, and fundraising income.
              </span>
            </div>
          </button>

          {userRole !== 'MEMBER' && (
            <button
              type="button"
              onClick={() => {
                setRecordType('expense')
                setError(null)
              }}
              className="group p-5 rounded-2xl border border-[#dce6df] hover:border-[#dfc093] bg-[#fafcfa] hover:bg-[#faf6ee] text-left transition-all flex flex-col justify-between"
            >
              <div className="w-11 h-11 rounded-xl bg-[#fbf0de] text-[#a4712b] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <strong className="block text-base text-[#213b31] font-semibold mb-1">
                  Money Spent
                </strong>
                <span className="text-xs text-[#718079] leading-relaxed block">
                  Transport, equipment, robes, sound, and rehearsals.
                </span>
              </div>
            </button>
          )}
        </div>
      ) : (
        /* STEP 2: FILL PROGRESSIVELY REVEALED FORM */
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <button
            type="button"
            onClick={() => {
              setRecordType(null)
              setError(null)
            }}
            className="text-xs text-[#4e7464] hover:text-[#213b31] font-medium flex items-center gap-1 mb-2 transition-colors"
          >
            ← Choose different record type
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-[#506359] uppercase tracking-wider mb-1.5">
              Amount (RWF)
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                step="100"
                required
                placeholder="e.g. 50,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#dbe4dd] bg-[#fafbfa] text-[#213b31] font-medium text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b8772] transition-all pr-16"
              />
              <span className="absolute right-4 top-3.5 text-xs font-semibold text-[#829289]">
                RWF
              </span>
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-semibold text-[#506359] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dbe4dd] bg-[#fafbfa] text-[#213b31] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b8772] transition-all"
            >
              <option value="">Select a category</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Member Association (Optional for Income) */}
          {recordType === 'income' && userRole !== 'MEMBER' && (
            <div>
              <label className="block text-xs font-semibold text-[#506359] uppercase tracking-wider mb-1.5">
                Choir Member (Optional)
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#dbe4dd] bg-[#fafbfa] text-[#213b31] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b8772] transition-all"
              >
                <option value="">None / General choir funds</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.voicePart})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#506359] uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dbe4dd] bg-[#fafbfa] text-[#213b31] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b8772] transition-all"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-[#506359] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="What was this record for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dbe4dd] bg-[#fafbfa] text-[#213b31] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b8772] transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-[#dce5df] bg-white text-[#5b6e64] hover:bg-[#f3f7f4] text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#315b4d] hover:bg-[#25493e] text-white text-xs font-semibold transition-all shadow-md shadow-[#315b4d]/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Record
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

