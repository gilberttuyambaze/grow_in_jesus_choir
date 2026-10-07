import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getDocuments, getFinancialRecords, getMemberByUserId } from '@/lib/db'
import { canViewAllFinances } from '@/lib/permissions'
import { DocumentsView } from '@/features/documents/DocumentsView'

export default async function DocumentsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const canViewAll = canViewAllFinances(session.role)
  const member = canViewAll ? null : await getMemberByUserId(session.userId)
  const [documents, records] = await Promise.all([
    getDocuments(undefined, canViewAll ? undefined : session.userId),
    canViewAll
      ? getFinancialRecords()
      : member
      ? getFinancialRecords({ memberId: member.id })
      : Promise.resolve([])
  ])

  return (
    <DocumentsView
      documents={documents}
      records={records}
      userRole={session.role}
    />
  )
}
