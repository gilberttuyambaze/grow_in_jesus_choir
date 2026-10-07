'use client'

import * as React from 'react'
import {
  FileText,
  Calendar,
  WalletCards,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Ban
} from 'lucide-react'
import { FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { reviewRecordAction, voidRecordAction } from '@/features/finances/actions'
import { useToast } from '@/components/ui/Toast'

interface RecordDetailModalProps {
  record: FinancialRecord | null
  isOpen: boolean
  onClose: () => void
  userRole: UserRole
  onStatusUpdated?: () => void
}

export function RecordDetailModal({
  record,
  isOpen,
  onClose,
  userRole,
  onStatusUpdated
}: RecordDetailModalProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()

  const [rejectReason, setRejectReason] = React.useState('')
  const [showRejectInput, setShowRejectInput] = React.useState(false)
  const [showVoidConfirm, setShowVoidConfirm] = React.useState(false)
  const [voidReason, setVoidReason] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (!record) return null

  const isReceived = record.type === 'income'
  const isPending = record.status === 'needs_review'
  const isRecorded = record.status === 'recorded'
  const isVoided = record.status === 'voided'
  const isLeader = userRole === 'LEADER' || userRole === 'ADMIN'

  const handleReview = async (decision: 'approve' | 'reject') => {
    setIsProcessing(true)
    const res = await reviewRecordAction(record.id, decision, rejectReason)
    setIsProcessing(false)
    setShowRejectInput(false)
    setRejectReason('')

    if (res.success) {
      showToastSuccess(
        decision === 'approve' ? 'Record Approved' : 'Record Rejected',
        res.message
      )
      onClose()
      if (onStatusUpdated) onStatusUpdated()
    } else {
      showToastError('Action Failed', res.error)
    }
  }

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      showToastError('Reason Required', 'Please enter a brief reason for voiding this record.')
      return
    }

    setIsProcessing(true)
    const res = await voidRecordAction(record.id, voidReason)
    setIsProcessing(false)
    setShowVoidConfirm(false)
    setVoidReason('')

    if (res.success) {
      showToastSuccess('Record Voided', res.message)
      onClose()
      if (onStatusUpdated) onStatusUpdated()
    } else {
      showToastError('Void Failed', res.error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Record: ${record.referenceNumber || record.id}`}
      description={`Choir financial record entered on ${formatDate(record.recordDate)}`}
    >
      <div className="space-y-5 pt-1">
        {/* Top Summary Banner matching Reference */}
        <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isReceived ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isReceived ? (
                <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              )}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isReceived ? 'Money Received' : 'Money Spent'}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
                {isReceived ? '+' : '-'} {formatCurrency(record.amount)}
              </h3>
            </div>
          </div>

          <div>
            {record.status === 'recorded' && <Badge variant="recorded">Recorded</Badge>}
            {record.status === 'needs_review' && <Badge variant="review">Needs Review</Badge>}
            {record.status === 'rejected' && <Badge variant="rejected">Rejected</Badge>}
            {record.status === 'voided' && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                Voided
              </span>
            )}
          </div>
        </div>

        {/* Detailed Attribute Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-2xl border border-slate-150">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Description</span>
            <strong className="text-slate-900 text-xs font-bold block mt-0.5">
              {record.description}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Category</span>
            <strong className="text-slate-900 text-xs font-bold block mt-0.5">
              {record.categoryName}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Transaction Date</span>
            <span className="text-slate-700 font-semibold block mt-0.5">
              {formatDate(record.recordDate)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Associated Person</span>
            <span className="text-slate-700 font-semibold block mt-0.5">
              {record.memberName || record.recordedByName}
            </span>
          </div>
        </div>

        {/* Rejection / Note Reason Banner (if exists) */}
        {record.rejectionReason && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <strong className="font-bold">Reason Note:</strong> {record.rejectionReason}
          </div>
        )}

        {/* Supporting Receipt Attachment (Section 143) */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-150 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {record.receiptFilename || 'Proof of Payment Attachment'}
              </span>
              <span className="text-[10px] text-slate-500">
                Ledger audit reference: {record.referenceNumber || 'Verified'}
              </span>
            </div>
          </div>
          <a
            href="/documents"
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-indigo-700 font-semibold text-[11px] hover:bg-indigo-50 transition-colors shadow-xs"
          >
            Open in Vault
          </a>
        </div>

        {/* LEADER REVIEW ACTIONS (Section 72) */}
        {isLeader && isPending && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {showRejectInput ? (
              <div className="space-y-2 p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200">
                <label className="block text-xs font-bold text-rose-900">
                  Reason for Rejection:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Missing receipt or incorrect amount"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('reject')}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                >
                  Reject Record
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('approve')}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify Balance</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* DESTRUCTIVE ACTION: VOID RECORD (Section 41 & 110) */}
        {isLeader && isRecorded && !isVoided && (
          <div className="pt-3 border-t border-slate-100">
            {showVoidConfirm ? (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Void this financial record?</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This action marks the record as voided and deducts it from the choir's verified balance.
                  Historical accountability is preserved in the audit log.
                </p>
                <input
                  type="text"
                  placeholder="Reason for voiding (e.g. duplicate entry or refund)..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowVoidConfirm(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVoid}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold"
                  >
                    Confirm Void
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowVoidConfirm(true)}
                  className="px-3.5 py-1.5 rounded-full border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Void Record</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
