import type { UserRole } from '@/types'

export const WORKSPACE_TOUR_ID = 'workspace-tour'
export const WORKSPACE_TOUR_VERSION = 1

export interface WorkspaceTourStep {
  id: string
  title: string
  section: string
  description: string
  meaning: string
  tip: string
  icon: 'layout' | 'wallet' | 'chart' | 'activity' | 'category' | 'review' | 'members' | 'record' | 'report' | 'document' | 'settings' | 'bell'
  href?: string
  actionLabel?: string
  action?: 'new-record'
}

const staffSteps: WorkspaceTourStep[] = [
  {
    id: 'workspace',
    title: 'Your workspace at a glance',
    section: 'Navigation and quick tools',
    description: 'The sidebar takes you to Dashboard, Financial Records, Choir Members, Reports, Documents, Audit Logs, Notifications, and Settings. The top bar keeps search, alerts, receipt access, and record creation close by.',
    meaning: 'The active item in the sidebar shows which section you are viewing. Badges on Financial Records show how many items need attention.',
    tip: 'Use the search button or Ctrl/⌘ + K to find a member, record, category, or document. Select the question mark anytime to resume this tour.',
    icon: 'layout'
  },
  {
    id: 'summary',
    title: 'Financial summary cards',
    section: 'Dashboard · key figures',
    description: 'The five cards summarize Current Balance, Money Received, Contribution Rate, Money Spent, and Active Members for your role’s data scope.',
    meaning: 'Balance is recorded income minus recorded expenses. Received and Spent exclude items still awaiting review. Contribution Rate counts active members with an income record, including records awaiting review.',
    tip: 'Use these cards for a quick snapshot, then open Financial Records or Reports to inspect the transactions behind a number.',
    icon: 'wallet',
    href: '/finances',
    actionLabel: 'Open financial records'
  },
  {
    id: 'money-flow',
    title: 'Money Flow chart',
    section: 'Dashboard · activity over time',
    description: 'The chart groups recorded income and expenses by the most recent record dates. Items that need review are shown separately.',
    meaning: 'Each point represents totals recorded on a date in the ledger, not a forecast. A missing point means no matching transaction was recorded for that date.',
    tip: 'If a value looks unexpected, use the ledger and its date, category, and status filters to find the underlying record.',
    icon: 'chart'
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    section: 'Dashboard · latest changes',
    description: 'This feed shows recent financial actions such as new records, approvals, rejections, and member reminders. When there are no audit entries yet, it shows recent records instead.',
    meaning: 'The person and date help explain who changed something and when. The Audit Logs page provides the broader history for authorized roles.',
    tip: 'Open “View All” to review the audit trail when you need more context.',
    icon: 'activity',
    href: '/activity',
    actionLabel: 'Open audit logs'
  },
  {
    id: 'categories',
    title: 'Top Financial Categories',
    section: 'Dashboard · spending and income mix',
    description: 'Categories rank recorded transactions by total amount and show each category’s share of the recorded total.',
    meaning: 'Only recorded items contribute to these totals. Income and expenses are labeled separately; pending, rejected, and voided records are excluded.',
    tip: 'Open Reports for category breakdowns and exportable statements.',
    icon: 'category',
    href: '/reports',
    actionLabel: 'Open reports'
  },
  {
    id: 'review-queue',
    title: 'Leader Review Queue',
    section: 'Dashboard · records needing attention',
    description: 'The queue lists financial records with the “Needs Review” status. Leaders and admins can open them to verify, approve, or reject them. Auditors can inspect records but cannot change them.',
    meaning: 'A pending record is not included in recorded income or expense totals until it is approved.',
    tip: 'Review the receipt, member, category, amount, and date before approving a transaction.',
    icon: 'review',
    href: '/finances?status=needs_review',
    actionLabel: 'Open review queue'
  },
  {
    id: 'status-ledger',
    title: 'Status chart and Financial Records Ledger',
    section: 'Dashboard · record lifecycle',
    description: 'The status chart counts Recorded, Needs Review, Rejected, and Voided records. The ledger below it lists recent transactions and links to the full records page.',
    meaning: 'Recorded items affect totals. Needs Review items are awaiting a decision. Rejected items were declined, and Voided items were withdrawn from use.',
    tip: 'Open a ledger row to inspect its details and attached receipt, when one is available.',
    icon: 'wallet',
    href: '/finances',
    actionLabel: 'Open the full ledger'
  },
  {
    id: 'members',
    title: 'Choir Members',
    section: 'Member directory and contributions',
    description: 'The directory organizes member profiles, active status, voice part, and contribution history. Leaders and admins can manage member records; auditors can review them.',
    meaning: 'Contribution indicators help identify members with recorded or pending income entries. They do not replace checking an individual member’s ledger.',
    tip: 'Use the voice-part and status filters to narrow the directory, then open a profile for its record history.',
    icon: 'members',
    href: '/members',
    actionLabel: 'Open choir members'
  },
  {
    id: 'new-record',
    title: 'Record financial activity',
    section: 'New Record action',
    description: 'Leaders and admins can record income or expenses with a category, amount, date, description, and optional member or receipt. Members can submit contributions for review. Auditors have read-only access.',
    meaning: 'Submissions may appear as Needs Review until an authorized leader approves them. Approved entries then flow into recorded totals and reports.',
    tip: 'Attach receipts and use a clear description so another reviewer can verify the transaction later.',
    icon: 'record',
    action: 'new-record',
    actionLabel: 'Open New Record'
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    section: 'Statements and exports',
    description: 'Reports summarize recorded income and expenses by period and category. You can print a statement or generate a CSV for further review.',
    meaning: 'Report totals reflect the selected date range and the records available to your role. Pending records remain separate from recorded totals.',
    tip: 'Check the reporting period before printing or sharing an export.',
    icon: 'report',
    href: '/reports',
    actionLabel: 'Open reports'
  },
  {
    id: 'documents',
    title: 'Documents & Receipts',
    section: 'Private document vault',
    description: 'The Documents area stores receipts, invoices, and other financial attachments. Files can be linked to a financial record and filtered by type or search text.',
    meaning: 'A linked document provides supporting evidence for its transaction. Access follows the same role and record permissions as the rest of the workspace.',
    tip: 'Upload a receipt from the Documents page or attach it while creating a record.',
    icon: 'document',
    href: '/documents',
    actionLabel: 'Open documents'
  },
  {
    id: 'alerts-settings',
    title: 'Audit, notifications, and settings',
    section: 'Workspace follow-through',
    description: 'Audit Logs capture important actions. Notifications call out relevant updates. Settings contains your profile, password controls, choir identity, and configured financial categories.',
    meaning: 'Audit logs support accountability; notifications help you notice work that needs attention; profile and security settings keep your account information current.',
    tip: 'Return to Settings to replay this tour. Leaders and admins can also see who has completed it.',
    icon: 'settings',
    href: '/settings',
    actionLabel: 'Open settings'
  }
]

const memberSteps: WorkspaceTourStep[] = [
  {
    id: 'workspace',
    title: 'Your workspace at a glance',
    section: 'Navigation and quick tools',
    description: 'The sidebar takes you to Dashboard, My Contributions, Notifications, Documents, and Settings. The top bar keeps search, alerts, receipt access, and contribution submission close by.',
    meaning: 'Your workspace shows records and details available to your account. The active sidebar item marks the section you are viewing.',
    tip: 'Use search to find records you are allowed to view. Select the question mark anytime to resume this tour.',
    icon: 'layout'
  },
  {
    id: 'personal-overview',
    title: 'Your personal dashboard',
    section: 'Dashboard · your contributions',
    description: 'Your dashboard summarizes your recorded contributions and items awaiting review. It only shows records associated with your member account.',
    meaning: 'A pending item has been submitted but is not yet part of the confirmed recorded total. A missing record may still need to be entered or linked to your member profile.',
    tip: 'Open My Contributions to review the dates, categories, amounts, and status of your entries.',
    icon: 'wallet',
    href: '/finances',
    actionLabel: 'Open my contributions'
  },
  {
    id: 'submit-contribution',
    title: 'Submit a contribution',
    section: 'Record action',
    description: 'Use the Record action to submit a contribution with its amount, date, category, and a clear description. Add a receipt when you have one.',
    meaning: 'Your submission may show Needs Review until a leader verifies it. After approval it appears as recorded in your contribution history.',
    tip: 'If a contribution is missing or its status seems wrong, contact a choir leader instead of submitting a duplicate.',
    icon: 'record',
    action: 'new-record',
    actionLabel: 'Open contribution form'
  },
  {
    id: 'documents',
    title: 'Documents & Receipts',
    section: 'Your financial attachments',
    description: 'Open Documents to view receipts or other files you are permitted to access. Some documents may be linked to a contribution record.',
    meaning: 'A linked receipt is supporting evidence for the related transaction. Access is limited to records you are allowed to view.',
    tip: 'You can attach a receipt when you submit a contribution.',
    icon: 'document',
    href: '/documents',
    actionLabel: 'Open documents'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    section: 'Updates that need your attention',
    description: 'The notification bell and Notifications page show updates related to your account and choir activity.',
    meaning: 'Unread indicators help separate new updates from ones you have already reviewed.',
    tip: 'Check notifications after submitting a contribution or when you are waiting for a review.',
    icon: 'bell',
    href: '/notifications',
    actionLabel: 'Open notifications'
  },
  {
    id: 'profile-security',
    title: 'Profile and account security',
    section: 'Settings',
    description: 'Settings lets you update your name and contact details, review your voice part and role, and change your password.',
    meaning: 'Your member profile helps leaders connect contributions to the right person. Keep your contact information current.',
    tip: 'Use a unique password and do not share it in chat or screenshots.',
    icon: 'settings',
    href: '/settings',
    actionLabel: 'Open settings'
  }
]

export function getWorkspaceTourSteps(role: UserRole): WorkspaceTourStep[] {
  if (role === 'MEMBER') return memberSteps
  if (role === 'AUDITOR') {
    return staffSteps.filter((step) => step.id !== 'new-record')
  }
  return staffSteps
}
