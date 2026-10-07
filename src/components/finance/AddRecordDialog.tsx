'use client'

import * as React from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Paperclip,
  FileText,
  UploadCloud,
  RotateCcw
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { FinancialCategory, Member, UserRole } from '@/types'
import { createRecordAction } from '@/features/finances/actions'
import { formatCurrency } from '@/lib/utils/currency'
import { getTodayISODate } from '@/lib/utils/date'
import { useToast } from '@/components/ui/Toast'

interface AddRecordDialogProps {
  isOpen: boolean
  onClose: () => void
  categories: FinancialCategory[]
  members: Member[]
  userRole: UserRole
  onSuccess?: () => void
}

const DRAFT_STORAGE_KEY = 'gijc_draft_financial_record'

export function AddRecordDialog({
  isOpen,
  onClose,
  categories,
  members,
  userRole,
  onSuccess
}: AddRecordDialogProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()

  const [recordType, setRecordType] = React.useState<'income' | 'expense' | null>(null)
  const [amount, setAmount] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [memberId, setMemberId] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [recordDate, setRecordDate] = React.useState(getTodayISODate())
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [hasDraftRestored, setHasDraftRestored] = React.useState(false)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successInfo, setSuccessInfo] = React.useState<{
    amount: number
    description: string
    message: string
  } | null>(null)

  // Restore draft on open (Section 122)
  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft)
          if (parsed.amount || parsed.description || parsed.categoryId) {
            setRecordType(parsed.recordType || null)
            setAmount(parsed.amount || '')
            setCategoryId(parsed.categoryId || '')
            setMemberId(parsed.memberId || '')
            setDescription(parsed.description || '')
            if (parsed.recordDate) setRecordDate(parsed.recordDate)
            setHasDraftRestored(true)
          }
        }
      } catch {
        // Ignore local storage parse errors
      }
    }
  }, [isOpen])

  // Save draft locally on input change (Section 122)
  React.useEffect(() => {
    if (isOpen && (amount || description || categoryId)) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            recordType,
            amount,
            categoryId,
            memberId,
            description,
            recordDate
          })
        )
      } catch {
        // Ignore storage write issues
      }
    }
  }, [isOpen, recordType, amount, categoryId, memberId, description, recordDate])

  // Filter categories by selected type
  const availableCategories = React.useMemo(() => {
    if (!recordType) return []
    return categories.filter((c) => c.type === recordType)
  }, [categories, recordType])

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {}
    setRecordType(null)
    setAmount('')
    setCategoryId('')
    setMemberId('')
    setDescription('')
    setRecordDate(getTodayISODate())
    setReceiptFile(null)
    setHasDraftRestored(false)
    setError(null)
  }

  const handleReset = () => {
    clearDraft()
    setSuccessInfo(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('Supporting document must be smaller than 5 MB.')
        return
      }
      setReceiptFile(file)
      setError(null)
    }
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

    let uploadedFilename: string | undefined = undefined

    // Upload receipt document if attached (Section 42 & 143)
    if (receiptFile) {
      try {
        const uploadData = new FormData()
        uploadData.append('file', receiptFile)
        uploadData.append('notes', `Attached to: ${description.trim()}`)

        const uploadRes = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadData
        })
        const uploadJson = await uploadRes.json()
        if (uploadRes.ok && uploadJson.document) {
          uploadedFilename = uploadJson.document.filename
        }
      } catch (uploadErr) {
        console.warn('Document upload warning:', uploadErr)
      }
    }

    const formData = new FormData()
    formData.append('type', recordType)
    formData.append('amount', parsedAmount.toString())
    formData.append('categoryId', categoryId)
    formData.append('recordDate', recordDate)
    formData.append('description', description.trim())
    if (memberId) formData.append('memberId', memberId)
    if (uploadedFilename) formData.append('receiptFilename', uploadedFilename)

    const result = await createRecordAction(formData)

    setIsSubmitting(false)

    if (result.success) {
      // Clear autosave draft
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {}

      const msg = result.message || 'Record successfully saved'
      showToastSuccess('Record saved successfully', msg)

      setSuccessInfo({
        amount: parsedAmount,
        description: description.trim(),
        message: msg
      })

      if (onSuccess) onSuccess()
    } else {
      setError(result.error || 'Failed to save record.')
      showToastError('Could not save record', result.error)
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
          ? 'Your entry has been registered in the choir ledger.'
          : !recordType
          ? 'Choose whether choir funds were received or spent.'
          : recordType === 'income'
          ? 'Contributions, gifts, and choir income.'
          : 'Transport, equipment, logistics, and choir expenses.'
      }
    >
      {/* SUCCESS CONFIRMATION STATE MATCHING SECTION 24 */}
      {successInfo ? (
        <div className="py-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
            Record Confirmed
          </p>
          <h3 className="text-3xl font-bold text-slate-900 my-2 font-sans tracking-tight">
            {formatCurrency(successInfo.amount)}
          </h3>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {successInfo.description}
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
            {successInfo.message}
          </p>

          <button
            onClick={handleClose}
            className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/20"
          >
            Done
          </button>
        </div>
      ) : !recordType ? (
        /* STEP 1: CHOOSE TYPE */
        <div className="space-y-4 py-3">
          {hasDraftRestored && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-800 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Unsaved draft recovered from local storage
              </span>
              <button
                type="button"
                onClick={clearDraft}
                className="text-[11px] underline hover:text-indigo-950"
              >
                Clear draft
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setRecordType('income')
                setError(null)
              }}
              className="group p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-left transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <strong className="block text-base text-slate-900 font-bold mb-1">
                  Money Received
                </strong>
                <span className="text-xs text-slate-500 leading-relaxed block">
                  Member contributions, Sunday offerings, gifts, and donations.
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
                className="group p-5 rounded-3xl border border-slate-200/80 hover:border-amber-400 bg-white hover:bg-amber-50/20 text-left transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="block text-base text-slate-900 font-bold mb-1">
                    Money Spent
                  </strong>
                  <span className="text-xs text-slate-500 leading-relaxed block">
                    Transport, uniforms/robes, rehearsal venue, sound & equipment.
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* STEP 2: FILL PROGRESSIVELY REVEALED FORM */
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setRecordType(null)
                setError(null)
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
            >
              ← Choose different record type
            </button>

            {hasDraftRestored && (
              <span className="text-[10px] text-slate-400 font-medium">
                Draft auto-saved
              </span>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (RWF) *
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-16"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                RWF
              </span>
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Financial Category *
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Choir Member (Optional)
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Record Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. October monthly contribution or Sunday offering"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Supporting Receipt Attachment (Section 22, 42, 143) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receipt / Proof of Payment (Optional)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center transition-all bg-slate-50/50 hover:bg-indigo-50/20">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {receiptFile ? (
                <div className="flex items-center justify-between text-xs text-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold truncate">{receiptFile.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({(receiptFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setReceiptFile(null)
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to attach receipt or invoice
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, or PDF up to 5 MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
