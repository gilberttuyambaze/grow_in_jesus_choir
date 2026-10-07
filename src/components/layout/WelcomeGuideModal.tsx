'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Sparkles, Users, PlusCircle, LayoutDashboard, Check } from 'lucide-react'

export function WelcomeGuideModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="Welcome to Grow in Jesus Choir 👋"
      description="A clean, calm workspace for organizing choir financial records & contributions."
      maxWidth="md"
    >
      <div className="space-y-4 py-2 text-xs">
        

        <div className="space-y-3 pt-1">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-150 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div>
              <strong className="text-slate-900 text-xs font-bold block">
                Record Financial Activity
              </strong>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Use the top <strong>+ New Record</strong> button to record member contributions, Sunday offerings, or logistics expenditures.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-150 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div>
              <strong className="text-slate-900 text-xs font-bold block">
                Monitor Contribution Progress
              </strong>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Check voice parts (Soprano, Alto, Tenor, Bass) under <strong>Members</strong> and send 1-click reminders to pending members.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-150 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div>
              <strong className="text-slate-900 text-xs font-bold block">
                Audit Reports & Receipts
              </strong>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Export church financial statements as CSV, print pastoral summaries, or inspect attached receipts in the <strong>Documents Vault</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            Got it, let's begin
          </button>
        </div>
      </div>
    </Modal>
  )
}
