import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowDownLeft, ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialRecords, getFinancialCategories } from '@/lib/db'
import { FinancesView } from '@/features/finances/FinancesView'

export default async function IncomePage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const records = getFinancialRecords({ type: 'income' })
  const categories = getFinancialCategories('income')

  return (
    <div className="space-y-4">
      <Link
        href="/finances"
        className="inline-flex items-center gap-1 text-xs text-[#527464] hover:text-[#1e382d] font-semibold"
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

