'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  WalletCards,
  Users,
  BarChart3,
  FileText,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react'
import { FinancialRecord, Member } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'

interface CommandSearchModalProps {
  isOpen: boolean
  onClose: () => void
  records: FinancialRecord[]
  members: Member[]
  onOpenAddRecord: () => void
  canAddRecords?: boolean
}

export function CommandSearchModal({
  isOpen,
  onClose,
  records,
  members,
  onOpenAddRecord,
  canAddRecords = true
}: CommandSearchModalProps) {
  const [query, setQuery] = React.useState('')
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter records
  const filteredRecords = React.useMemo(() => {
    if (!query.trim()) return records.slice(0, 4)
    const q = query.toLowerCase()
    return records
      .filter((r) => r.description.toLowerCase().includes(q) || r.categoryName?.toLowerCase().includes(q))
      .slice(0, 5)
  }, [records, query])

  // Filter members
  const filteredMembers = React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return members
      .filter((m) => m.fullName.toLowerCase().includes(q) || m.voicePart.toLowerCase().includes(q))
      .slice(0, 4)
  }, [members, query])

  if (!isOpen) return null

  const handleSelectNav = (path: string) => {
    onClose()
    router.push(path)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 pb-6 bg-slate-900/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, members, sections, or navigate..."
            className="command-search-input w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 text-xs">
          {/* Quick Actions */}
          {canAddRecords && <div className="p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Quick Actions
            </span>
            <button
              onClick={() => {
                onClose()
                onOpenAddRecord()
              }}
              className="w-full p-2.5 rounded-2xl text-left hover:bg-indigo-50/60 flex items-center justify-between text-indigo-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="font-semibold text-xs">+ Add New Financial Record</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>}

          {/* Records Section */}
          {filteredRecords.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Financial Records
              </span>
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectNav('/finances')}
                  className="p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WalletCards className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-900">
                      {r.description}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-2">
                    {formatCurrency(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Choir Members
              </span>
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectNav('/members')}
                  className="p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-900">{m.fullName}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold px-2 py-0.5 rounded-full bg-slate-100">
                    {m.voicePart}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Links */}
          <div className="p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Workspace Pages
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <button
                onClick={() => handleSelectNav('/dashboard')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dashboard Overview</span>
              </button>
              <button
                onClick={() => handleSelectNav('/finances')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <WalletCards className="w-3.5 h-3.5 text-indigo-600" />
                <span>Financial Ledger</span>
              </button>
              <button
                onClick={() => handleSelectNav('/members')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>50 Choir Members</span>
              </button>
              <button
                onClick={() => handleSelectNav('/reports')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reports & Exports</span>
              </button>
              <button
                onClick={() => handleSelectNav('/documents')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Receipts & Documents</span>
              </button>
              <button
                onClick={() => handleSelectNav('/settings')}
                className="p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors font-medium"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Workspace Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
