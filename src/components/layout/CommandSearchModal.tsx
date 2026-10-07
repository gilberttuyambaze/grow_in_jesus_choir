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
}

export function CommandSearchModal({
  isOpen,
  onClose,
  records,
  members,
  onOpenAddRecord
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#19352b]/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#dce6df] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#e5ebe6] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#798e83] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, members, sections, or navigate..."
            className="w-full text-xs text-[#203a30] placeholder-[#8a9e93] focus:outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-[#edf2ee] border border-[#dce4de] text-[10px] font-mono text-[#6c7f75]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#f2f6f3] text-xs">
          {/* Quick Actions */}
          <div className="p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#91a399] px-2 block mb-1">
              Quick Actions
            </span>
            <button
              onClick={() => {
                onClose()
                onOpenAddRecord()
              }}
              className="w-full p-2 rounded-xl text-left hover:bg-[#eaf3ec] flex items-center justify-between text-[#244f3e] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#d5e8dc] text-[#244f3e] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span className="font-medium">+ Add New Financial Record</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8fa096]" />
            </button>
          </div>

          {/* Records Section */}
          {filteredRecords.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#91a399] px-2 block mb-1">
                Financial Records
              </span>
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectNav('/finances')}
                  className="p-2 rounded-xl hover:bg-[#f4f7f5] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WalletCards className="w-4 h-4 text-[#4e7463] shrink-0" />
                    <span className="truncate font-medium text-[#203a30]">
                      {r.description}
                    </span>
                  </div>
                  <span className="font-semibold text-[#295c46] shrink-0 ml-2">
                    {formatCurrency(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#91a399] px-2 block mb-1">
                Choir Members
              </span>
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectNav('/members')}
                  className="p-2 rounded-xl hover:bg-[#f4f7f5] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#4e7463]" />
                    <span className="font-medium text-[#203a30]">{m.fullName}</span>
                  </div>
                  <span className="text-[11px] text-[#71857a] px-2 py-0.5 rounded-md bg-[#edf2ee]">
                    {m.voicePart}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Links */}
          <div className="p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#91a399] px-2 block mb-1">
              Workspace Pages
            </span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => handleSelectNav('/dashboard')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>Dashboard Overview</span>
              </button>
              <button
                onClick={() => handleSelectNav('/finances')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <WalletCards className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>Financial Ledger</span>
              </button>
              <button
                onClick={() => handleSelectNav('/members')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>50 Choir Members</span>
              </button>
              <button
                onClick={() => handleSelectNav('/reports')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>Reports & Exports</span>
              </button>
              <button
                onClick={() => handleSelectNav('/documents')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>Receipts & Documents</span>
              </button>
              <button
                onClick={() => handleSelectNav('/settings')}
                className="p-2 rounded-lg text-left hover:bg-[#f0f5f1] text-[#335345] flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5 text-[#6c8f7d]" />
                <span>Workspace Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

