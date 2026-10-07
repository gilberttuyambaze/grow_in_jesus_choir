import { redirect } from 'next/navigation'
import { Clock, ShieldCheck, UserCheck, FileText, CheckCircle2, XCircle, PlusCircle } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getAuditLogs } from '@/lib/db'
import { formatDateTime } from '@/lib/utils/date'
import { Card } from '@/components/ui/Card'

export default async function ActivityPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const auditLogs = getAuditLogs(50)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
          Activity & Audit Log
        </h1>
        <p className="text-xs text-[#71857a] mt-0.5">
          Verifiable ledger of all financial creations, approvals, and system events.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {auditLogs.map((log, index) => {
            const isApproved = log.action === 'RECORD_APPROVED'
            const isRejected = log.action === 'RECORD_REJECTED'
            const isCreated = log.action === 'RECORD_CREATED'

            return (
              <div key={log.id} className="flex items-start gap-4 text-xs">
                {/* Event Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-[#e4efe6] text-[#2c5b48]'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 pb-6 border-b border-[#edf2ee]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#1e382d]">
                      {log.actorName}
                    </span>
                    <span className="text-[11px] text-[#7d9086] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  <p className="text-[#51675c] leading-relaxed">
                    {isCreated && 'Created a new financial record.'}
                    {isApproved && 'Approved and confirmed pending financial record.'}
                    {isRejected && 'Rejected pending financial record.'}
                    {!isCreated && !isApproved && !isRejected && `Performed action: ${log.action}`}
                  </p>

                  {log.details && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#f7faf8] border border-[#e5ece7] text-[11px] font-mono text-[#436253]">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
