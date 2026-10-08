import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getNotifications } from '@/lib/db'
import { NotificationsView } from '@/features/notifications/NotificationsView'

export default async function NotificationsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  let notifications: import('@/types').NotificationItem[] = []
  try {
    notifications = await getNotifications(session.userId, 100)
  } catch (error) {
    console.error('[NotificationsPage getNotifications error]', error)
  }

  return (
    <NotificationsView
      notifications={notifications}
      userRole={session.role}
    />
  )
}

