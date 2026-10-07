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
  Trash2
} from 'lucide-react'
import { FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { reviewRecordAction } from '@/features/finances/actions'

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
  const [rejectReason, setRejectReason] = React.useState('')
  const [showRejectInput, setShowRejectInput] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (!record) return null

  const isReceived = record.type === 'income'
  const isPending = record.status === 'needs_review'

  const handleAction = async (decision: 'approve' | 'reject') => {
    setIsProcessing(true)
    await reviewRecordAction(record.id, decision, rejectReason)
    setIsProcessing(false)
    setShowRejectInput(false)
    setRejectReason('')
    onClose()
    if (onStatusUpdated) onStatusUpdated()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Record Details: ${record.referenceNumber || record.id}`}
      description={`Logged in choir financial database on ${formatDate(record.createdAt)}`}
    >
      <div className="space-y-5 pt-2">
        {/* Top Summary Banner */}
        <div className="p-5 rounded-2xl bg-[#fafcfa] border border-[#e2eae4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isReceived ? 'bg-[#e3efe6] text-[#3b754f]' : 'bg-[#fbf0de] text-[#a57338]'
              }`}
            >
              {isReceived ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#798e82] block">
                {isReceived ? 'Money Received' : 'Money Spent'}
              </span>
              <h3 className="text-xl font-serif font-medium text-[#1e382d]">
                {isReceived ? '+' : '-'} {formatCurrency(record.amount)}
              </h3>
            </div>
          </div>

          <div>
            {record.status === 'recorded' && <Badge variant="recorded">Recorded</Badge>}
            {record.status === 'needs_review' && <Badge variant="review">Needs Review</Badge>}
            {record.status === 'rejected' && <Badge variant="rejected">Rejected</Badge>}
          </div>
        </div>

        {/* Detailed Attribute Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-[#7d9086] block">Description</span>
            <strong className="text-[#203a30] text-sm font-semibold">{record.description}</strong>
          </div>
          <div>
            <span className="text-[11px] text-[#7d9086] block">Category</span>
            <strong className="text-[#203a30] text-sm font-semibold">{record.categoryName}</strong>
          </div>
          <div>
            <span className="text-[11px] text-[#7d9086] block">Transaction Date</span>
            <span className="text-[#203a30] font-medium">{formatDate(record.recordDate)}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#7d9086] block">Associated Person</span>
            <span className="text-[#203a30] font-medium">
              {record.memberName || record.recordedByName}
            </span>
          </div>
        </div>

        {/* Rejection / Note Reason Banner (if exists) */}
        {record.rejectionReason && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <strong>Rejection Reason:</strong> {record.rejectionReason}
          </div>
        )}

        {/* Supporting Receipt Attachment */}
        <div className="p-3.5 rounded-xl bg-[#f5f9f6] border border-[#e3ede6] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#446d5c]" />
            <div>
              <span className="font-semibold text-[#203a30] block">
                {record.receiptFilename || 'Proof of Payment Attachment'}
              </span>
              <span className="text-[10px] text-[#71857a]">
                Verified against ledger reference {record.referenceNumber}
              </span>
            </div>
          </div>
          <a
            href="/documents"
            className="px-2.5 py-1 rounded-lg bg-white border border-[#dce6df] text-[#2c5344] font-semibold text-[11px] hover:bg-[#edf4ee] transition-colors"
          >
            View in Documents
          </a>
        </div>

        {/* Leader Review / Action Buttons */}
        {userRole === 'LEADER' && isPending && (
          <div className="pt-3 border-t border-[#edf2ee] space-y-3">
            {showRejectInput ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#52665c]">
                  Reason for Rejection:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Missing receipt or incorrect category"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#dbe4dd] text-xs text-[#203a30]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#607469]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                >
                  Reject Record
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify Balance</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

