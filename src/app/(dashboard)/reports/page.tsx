import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialSummary, getFinancialRecords, getFinancialCategories } from '@/lib/db'
import { ReportsView } from '@/features/reports/ReportsView'

export default async function ReportsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const summary = getFinancialSummary()
  const records = getFinancialRecords()
  const categories = getFinancialCategories()

  return (
    <ReportsView
      summary={summary}
      records={records}
      categories={categories}
    />
  )
}

