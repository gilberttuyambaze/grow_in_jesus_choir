import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialRecords, getFinancialCategories } from '@/lib/db'
import { FinancesView } from '@/features/finances/FinancesView'

export default async function ExpensesPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }
  if (session.role === 'MEMBER') {
    redirect('/dashboard')
  }

  const isLeader = session.role === 'LEADER' || session.role === 'ADMIN'
  const records = isLeader ? await getFinancialRecords({ type: 'expense' }) : []
  const categories = await getFinancialCategories('expense')

  return (
    <div className="space-y-4">
      <Link
        href="/finances"
        className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to All Finances</span>
      </Link>

      <FinancesView
        records={records}
        categories={categories}
        userRole={session.role}
      />
    </div>
  )
}
