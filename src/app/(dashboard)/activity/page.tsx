import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getAuditLogs } from '@/lib/db'
import { formatDateTime } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { CrystalBadge } from '@/components/ui/CrystalBadge'

export default async function ActivityPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  if (session.role === 'MEMBER') {
    redirect('/dashboard')
  }

  const auditLogs = await getAuditLogs(50)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Audit Ledger & Activity Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical, verifiable record of all financial creations, approvals, rejections, and reminders.
          </p>
        </div>
        <div className="glowing-count-pill self-start sm:self-auto px-3.5 py-1 text-xs">
          {auditLogs.length} events logged
        </div>
      </div>

      {/* Audit Log Cards matching Reference */}
      {auditLogs.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-slate-400">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="space-y-3.5">
          {auditLogs.map((log) => {
            const isApproved = log.action === 'RECORD_APPROVED'
            const isRejected = log.action === 'RECORD_REJECTED'
            const isCreated = log.action === 'RECORD_CREATED'
            const isVoided = log.action === 'RECORD_VOIDED'
            const isReminders = log.action === 'MEMBER_REMINDERS_DISPATCHED'

            const details = log.details as any

            const badgeType = isApproved
              ? 'success'
              : isCreated
              ? 'success'
              : isRejected
              ? 'alert'
              : isVoided
              ? 'warning'
              : isReminders
              ? 'purple'
              : 'info'

            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_28px_-2px_rgba(15,23,42,0.06),0_20px_44px_-4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] transition-all duration-200 flex items-start gap-4 text-xs"
              >
                {/* 3D Crystal Gem Emblem */}
                <CrystalBadge type={badgeType} size="md" className="shrink-0 mt-0.5" />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {log.actorName}
                    </span>
                    <span suppressHydrationWarning className="text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  {/* Human-friendly action description */}
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {isCreated && (
                      <span>
                        Added a new financial record:{' '}
                        <strong className="text-slate-900">
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
      )}
    </div>
  )
}
