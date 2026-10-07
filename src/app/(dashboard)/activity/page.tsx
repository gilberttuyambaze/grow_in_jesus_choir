import { redirect } from 'next/navigation'
import {
  Clock,
  ShieldCheck,
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Ban,
  BellRing,
  Sparkles
} from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getAuditLogs } from '@/lib/db'
import { formatDateTime } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'

export default async function ActivityPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const auditLogs = getAuditLogs(50)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header matching Reference */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
          Audit Ledger & Activity Timeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical, verifiable record of all financial creations, approvals, rejections, and reminders.
        </p>
      </div>

      {/* Audit Log Card matching Reference */}
      <div className="card-surface p-6 bg-white space-y-6">
        <div className="space-y-5">
          {auditLogs.map((log) => {
            const isApproved = log.action === 'RECORD_APPROVED'
            const isRejected = log.action === 'RECORD_REJECTED'
            const isCreated = log.action === 'RECORD_CREATED'
            const isVoided = log.action === 'RECORD_VOIDED'
            const isReminders = log.action === 'MEMBER_REMINDERS_DISPATCHED'

            const details = log.details as any

            return (
              <div key={log.id} className="flex items-start gap-4 text-xs">
                {/* Event Icon Pill */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-600'
                      : isRejected
                      ? 'bg-rose-50 text-rose-600'
                      : isVoided
                      ? 'bg-slate-100 text-slate-600'
                      : isReminders
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {isApproved && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  {isRejected && <XCircle className="w-5 h-5 stroke-[2.5]" />}
                  {isVoided && <Ban className="w-5 h-5 stroke-[2.5]" />}
                  {isReminders && <BellRing className="w-5 h-5 stroke-[2.5]" />}
                  {isCreated && <PlusCircle className="w-5 h-5 stroke-[2.5]" />}
                  {!isApproved && !isRejected && !isVoided && !isReminders && !isCreated && (
                    <Clock className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 pb-5 border-b border-slate-100 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {log.actorName}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  {/* Human-friendly action description (Section 2 & 71) */}
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {isCreated && (
                      <span>
                        Added a new financial record:{' '}
                        <strong>
                          {details?.amount ? formatCurrency(details.amount) : ''}
                        </strong>{' '}
                        ({details?.description || 'Choir transaction'}).
                      </span>
                    )}
                    {isApproved && (
                      <span className="text-emerald-800">
                        Approved pending transaction and verified balance update.
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-rose-800">
                        Rejected pending record.
                        {details?.reason && (
                          <span className="block mt-0.5 text-xs text-rose-600 font-normal">
                            Reason: "{details.reason}"
                          </span>
                        )}
                      </span>
                    )}
                    {isVoided && (
                      <span className="text-amber-800">
                        Marked record as voided.
                        {details?.reason && (
                          <span className="block mt-0.5 text-xs text-amber-700 font-normal">
                            Reason: "{details.reason}"
                          </span>
                        )}
                      </span>
                    )}
                    {isReminders && (
                      <span className="text-purple-800">
                        Dispatched gentle monthly contribution reminders to{' '}
                        <strong>{details?.count || 'choir'}</strong> members.
                      </span>
                    )}
                    {!isCreated && !isApproved && !isRejected && !isVoided && !isReminders && (
                      <span>Performed system event: {log.action}</span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
