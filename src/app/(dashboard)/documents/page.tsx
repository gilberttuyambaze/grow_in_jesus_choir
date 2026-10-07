import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getDocuments, getFinancialRecords } from '@/lib/db'
import { DocumentsView } from '@/features/documents/DocumentsView'

export default async function DocumentsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const documents = getDocuments()
  const records = getFinancialRecords()

  return (
    <DocumentsView
      documents={documents}
      records={records}
      userRole={session.role}
    />
  )
}

