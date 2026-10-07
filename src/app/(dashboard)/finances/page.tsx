import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialRecords, getFinancialCategories } from '@/lib/db'
import { FinancesView } from '@/features/finances/FinancesView'

export default async function FinancesPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const records = getFinancialRecords()
  const categories = getFinancialCategories()

  return (
    <FinancesView
      records={records}
      categories={categories}
      userRole={session.role}
    />
  )
}
