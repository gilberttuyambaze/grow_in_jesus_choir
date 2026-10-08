'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle, MoreHorizontal, LoaderCircle, ArrowRight } from 'lucide-react'
import { FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/Badge'
import { reviewRecordAction } from '@/features/finances/actions'
import { RecordDetailModal } from './RecordDetailModal'
import { useToast } from '@/components/ui/Toast'
import { CrystalBadge } from '@/components/ui/CrystalBadge'

interface FinancialRecordTableProps {
  records: FinancialRecord[]
  userRole: UserRole
  onStatusChange?: () => void
  initialSelectedRecordId?: string | null
}

export function FinancialRecordTable({
  records,
  userRole,
  onStatusChange,
  initialSelectedRecordId
}: FinancialRecordTableProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()
  const [selectedRecord, setSelectedRecord] = React.useState<FinancialRecord | null>(null)
  const [activeReviewId, setActiveReviewId] = React.useState<string | null>(null)
  const [activeDecision, setActiveDecision] = React.useState<'approve' | 'reject' | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const reviewLock = React.useRef(false)
  const canReview = userRole === 'LEADER' || userRole === 'ADMIN'

  React.useEffect(() => {
    if (initialSelectedRecordId) {
      const found = records.find((r) => r.id === initialSelectedRecordId)
      if (found) {
        setSelectedRecord(found)
      }
    }
  }, [initialSelectedRecordId, records])

  const handleReview = async (recordId: string, decision: 'approve' | 'reject') => {
    if (reviewLock.current) return
    reviewLock.current = true
    setIsProcessing(true)
    setActiveReviewId(recordId)
    setActiveDecision(decision)
    try {
      const res = await reviewRecordAction(recordId, decision)
      if (res.success) {
        showToastSuccess(decision === 'approve' ? 'Record Approved' : 'Record Rejected', res.message)
        if (onStatusChange) onStatusChange()
      } else {
        showToastError('Review Failed', res.error)
      }
    } catch {
      showToastError('Review Failed', 'Please try again.')
    } finally {
      reviewLock.current = false
      setIsProcessing(false)
      setActiveReviewId(null)
      setActiveDecision(null)
    }
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white/60">
        <Clock className="w-9 h-9 text-slate-400 mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-semibold text-slate-900">No financial records found</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
          Once choir transactions or contributions are entered, they will be tracked here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* DESKTOP TABLE VIEW (Visible md and above) */}
      <div className="hidden md:block overflow-x-auto rounded-[24px] border border-white/95 bg-white/85 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_14px_34px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Member / Added by</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              {canReview && <th className="py-3.5 px-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {records.map((record) => {
              const isReceived = record.type === 'income'
              const isPending = record.status === 'needs_review'

              return (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                    {formatDate(record.recordDate)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isReceived ? 'bg-[#e4efe6] text-[#3e7d50]' : 'bg-[#fbf0de] text-[#a57338]'
                        }`}
                      >
                        {isReceived ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="min-w-0">{record.description}{record.sessionRecordKind && <span className="ml-2 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-indigo-700">{record.sessionRecordKind.replaceAll('_', ' ').toLowerCase()}</span>}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                      {record.categoryName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {record.memberName || record.recordedByName}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                      isReceived ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isReceived ? '+' : '-'} {formatCurrency(record.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {record.status === 'recorded' && (
                      <Badge variant="recorded">Recorded</Badge>
                    )}
                    {record.status === 'needs_review' && (
                      <Badge variant="review">Needs review</Badge>
                    )}
                    {record.status === 'rejected' && (
                      <Badge variant="rejected">Rejected</Badge>
                    )}
                    {record.status === 'voided' && (
                      <Badge variant="voided">Voided</Badge>
                    )}
                  </td>
                  {canReview && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(event) => { event.stopPropagation(); void handleReview(record.id, 'approve') }}
                            disabled={isProcessing}
                            aria-busy={isProcessing && activeReviewId === record.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
                          >
                            {isProcessing && activeReviewId === record.id && activeDecision === 'approve' ? <LoaderCircle className="inline h-3 w-3 animate-spin" /> : null} {isProcessing && activeReviewId === record.id && activeDecision === 'approve' ? 'Approving…' : 'Approve'}
                          </button>
                          <button
                            onClick={(event) => { event.stopPropagation(); void handleReview(record.id, 'reject') }}
                            disabled={isProcessing}
                            aria-busy={isProcessing && activeReviewId === record.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
                          >
                            {isProcessing && activeReviewId === record.id && activeDecision === 'reject' ? <LoaderCircle className="inline h-3 w-3 animate-spin" /> : null} {isProcessing && activeReviewId === record.id && activeDecision === 'reject' ? 'Rejecting…' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#93a299]">Verified</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE RESPONSIVE CARDS VIEW (Visible below md) */}
      <div className="md:hidden space-y-3.5">
        {records.map((record) => {
          const isReceived = record.type === 'income'
          const isPending = record.status === 'needs_review'

          return (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_28px_-2px_rgba(15,23,42,0.06),0_20px_44px_-4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] flex flex-col gap-3.5 cursor-pointer active:scale-[0.99] transition-all min-w-0"
            >
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CrystalBadge
                    type={isReceived ? 'purple' : 'warning'}
                    size="xs"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                      {record.description}
                    </h5>
                    {record.sessionRecordKind && <span className="mt-1 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-700">{record.sessionRecordKind.replaceAll('_', ' ').toLowerCase()}</span>}
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      {formatDate(record.recordDate)} • {record.categoryName}
                    </span>
                  </div>
                </div>

                <div
                  className={`text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 text-right ${
                    isReceived ? 'text-indigo-700' : 'text-slate-900'
                  }`}
                >
                  {isReceived ? '+' : '-'} {formatCurrency(record.amount)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                  {record.memberName || record.recordedByName}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {record.status === 'recorded' && (
                    <Badge variant="recorded">Recorded</Badge>
                  )}
                  {record.status === 'needs_review' && (
                    <Badge variant="review">Needs review</Badge>
                  )}
                  {record.status === 'rejected' && (
                    <Badge variant="rejected">Rejected</Badge>
                  )}
                  {record.status === 'voided' && (
                    <Badge variant="voided">Voided</Badge>
                  )}
                </div>
              </div>

              {canReview && isPending && (
                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReview(record.id, 'approve')
                    }}
                    disabled={isProcessing}
                    aria-busy={isProcessing && activeReviewId === record.id}
                    className="liquid-silver-button flex-1 min-h-[42px] text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 disabled:cursor-wait disabled:opacity-60 shadow-xs"
                  >
                    {isProcessing && activeReviewId === record.id && activeDecision === 'approve' ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Approving…</> : 'Approve'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReview(record.id, 'reject')
                    }}
                    disabled={isProcessing}
                    aria-busy={isProcessing && activeReviewId === record.id}
                    className="liquid-silver-button flex-1 min-h-[42px] text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 transition-colors disabled:cursor-wait disabled:opacity-60 shadow-xs"
                  >
                    {isProcessing && activeReviewId === record.id && activeDecision === 'reject' ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Rejecting…</> : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Record Detail & Lifecycle Modal */}
      <RecordDetailModal
        record={selectedRecord}
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        userRole={userRole}
        onStatusUpdated={onStatusChange}
      />
    </div>
  )
}
