'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle, MoreHorizontal } from 'lucide-react'
import { FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/Badge'
import { reviewRecordAction } from '@/features/finances/actions'
import { RecordDetailModal } from './RecordDetailModal'
import { useToast } from '@/components/ui/Toast'

interface FinancialRecordTableProps {
  records: FinancialRecord[]
  userRole: UserRole
  onStatusChange?: () => void
}

export function FinancialRecordTable({
  records,
  userRole,
  onStatusChange
}: FinancialRecordTableProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()
  const [selectedRecord, setSelectedRecord] = React.useState<FinancialRecord | null>(null)
  const [activeReviewId, setActiveReviewId] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleReview = async (recordId: string, decision: 'approve' | 'reject') => {
    setIsProcessing(true)
    const res = await reviewRecordAction(recordId, decision)
    setIsProcessing(false)
    setActiveReviewId(null)
    if (res.success) {
      showToastSuccess(
        decision === 'approve' ? 'Record Approved' : 'Record Rejected',
        res.message
      )
      if (onStatusChange) onStatusChange()
    } else {
      showToastError('Review Failed', res.error)
    }
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-[#dce6df] rounded-2xl bg-[#fafcfa]">
        <Clock className="w-9 h-9 text-[#85988e] mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-semibold text-[#294237]">No financial records found</h4>
        <p className="text-xs text-[#718079] max-w-xs mx-auto mt-1">
          Once choir transactions or contributions are entered, they will be tracked here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* DESKTOP TABLE VIEW (Visible md and above) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#e2e9e4] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#edf2ee] bg-[#f9fbf9] text-[11px] font-bold text-[#718379] uppercase tracking-wider">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Member / Added by</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              {userRole === 'LEADER' && <th className="py-3.5 px-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f1] text-xs">
            {records.map((record) => {
              const isReceived = record.type === 'income'
              const isPending = record.status === 'needs_review'

              return (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-[#f8faf9] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 text-[#607168] whitespace-nowrap font-medium">
                    {formatDate(record.recordDate)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#213b31]">
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
                      <span>{record.description}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#52665b]">
                    <span className="px-2 py-0.5 rounded-md bg-[#f0f4f1] text-[11px] font-medium text-[#415b4f]">
                      {record.categoryName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#607168]">
                    {record.memberName || record.recordedByName}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                      isReceived ? 'text-[#367949]' : 'text-[#af644d]'
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
                  {userRole === 'LEADER' && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleReview(record.id, 'approve')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(record.id, 'reject')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
                          >
                            Reject
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
      <div className="md:hidden space-y-3">
        {records.map((record) => {
          const isReceived = record.type === 'income'
          const isPending = record.status === 'needs_review'

          return (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-indigo-300 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-all min-w-0"
            >
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isReceived ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                      {record.description}
                    </h5>
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

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
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

              {userRole === 'LEADER' && isPending && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReview(record.id, 'approve')
                    }}
                    disabled={isProcessing}
                    className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold flex items-center justify-center transition-all shadow-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReview(record.id, 'reject')
                    }}
                    disabled={isProcessing}
                    className="flex-1 min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    Reject
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

