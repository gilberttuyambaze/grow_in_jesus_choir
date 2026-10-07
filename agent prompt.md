# GROW IN JESUS CHOIR
## Financial Monitoring & Records Management Platform
### Master Product, UX, UI, Architecture & Development Prompt

---

# 1. ROLE AND MISSION

You are the lead product engineer, senior full-stack developer, UX architect, UI designer, accessibility specialist, database architect, security engineer, and motion designer responsible for building a production-quality web platform for **Grow in Jesus Choir**.

The platform is called:

**Grow in Jesus Choir Financial Monitoring Platform**

The purpose of the platform is to provide Grow in Jesus Choir with a modern, secure, highly usable, visually exceptional, and future-proof system for managing, organizing, monitoring, and understanding its financial records.

The people who will use this platform are not necessarily technical people. Therefore, the most important requirement is not technological sophistication. The most important requirement is **human simplicity**.

The application must feel advanced while remaining extremely easy to use.

The design philosophy is:

> **Futuristic technology underneath. Simple human experience on top.**

The application should feel like a premium product designed for the future, but users should never feel that they need technical training to operate it.

The visual direction is:

- Light mode first
- Premium
- Futuristic
- Elegant
- Minimal
- High-tech
- Calm
- Professional
- Human
- Financially trustworthy
- Motion-rich but not distracting
- Responsive
- Accessible
- Fast
- Extremely polished

The project should not look like a generic administration dashboard, generic accounting software, generic church management software, or a standard Tailwind template.

It should have its own identity.

The goal is to create a platform that could still look excellent many years into the future.

Do not chase temporary design trends.

Build timeless fundamentals and add futuristic technology through motion, interaction, spatial composition, intelligent visualization, and carefully controlled visual effects.

---

# 2. CORE PRODUCT PRINCIPLE

The single most important product principle is:

> **Complexity must be hidden, not exposed.**

Users should not have to understand accounting terminology in order to use the system.

Do not force normal members to understand:

- Debits
- Credits
- Ledgers
- Journal entries
- Accounting periods
- General ledger terminology
- Database concepts
- Technical IDs
- Internal statuses
- Complex reconciliation concepts

The application should translate technical and accounting complexity into understandable human language.

Instead of:

> Create journal transaction

Use:

> Add financial record

Instead of:

> Debit account

Use:

> Money spent

Instead of:

> Credit account

Use:

> Money received

Instead of:

> Reconciliation discrepancy

Use:

> Something needs to be checked

Instead of:

> Transaction metadata

Use:

> Record details

The system may internally use sophisticated accounting and database structures, but the interface must communicate naturally.

---

# 3. PROJECT USERS

The platform initially has two primary user roles:

## 3.1 MEMBER

A member is a normal choir member who needs to interact with the platform without accessing administrative functionality.

Members should have a simple experience.

Potential member capabilities include:

- Sign in
- View personal dashboard
- View personal contribution history
- Add permitted financial records
- Submit contributions
- Submit financial information where permitted
- View the status of submitted records
- View relevant announcements
- View their own activity
- Update basic profile information
- Receive notifications
- View approved information made available to members

Members must NOT automatically have access to:

- All financial records
- Other members' private information
- Administrative settings
- User management
- Role management
- Audit logs
- System configuration
- Financial editing beyond their permissions
- Sensitive organizational information

Every member-facing screen must be deliberately simplified.

---

# 3.2 LEADER

A leader is responsible for managing and monitoring choir finances and organizational records.

Leader functionality should include:

- Financial dashboard
- Income management
- Expense management
- Contributions
- Member management
- Financial record management
- Review submitted records
- Approve or reject records when applicable
- Edit records where authorized
- View financial trends
- View current balance
- View income
- View expenses
- View contribution progress
- View recent activity
- View financial reports
- Export reports
- Manage receipts/documents
- View audit history
- Manage permitted settings
- Manage notifications
- Monitor financial health

Leaders should have more power, but the interface must remain simple.

Administrative power must not mean a cluttered interface.

---

# 3.3 FUTURE ADMIN ROLE

Architect the authorization system so that a future ADMIN role can be introduced without restructuring the entire application.

Do not hard-code the application around exactly two roles.

Use role-based access control.

Possible future roles:

- MEMBER
- LEADER
- ADMIN
- TREASURER
- FINANCE_MANAGER
- AUDITOR

Do not implement unnecessary roles unless required, but design the authorization layer so the system can grow.

---

# 4. PRODUCT EXPERIENCE

The primary user journey should feel like this:

```text
Open platform
    ↓
Sign in
    ↓
See clear dashboard
    ↓
Understand financial situation
    ↓
Perform one simple action
    ↓
Confirm
    ↓
Done
```

The user should not have to navigate through unnecessary pages.

For common actions, reduce the number of clicks and cognitive decisions.

The most common action should be highly visible.

For example:

**+ Add Record**

This should be easy to access from the dashboard.

---

# 5. ROOT PROJECT STRUCTURE

The project must use three primary application directories:

```text
/
├── public/
├── src/
└── database/
```

These are the three major roots of the application.

The repository root itself should remain clean.

Configuration files may remain at the project root because framework/tooling conventions require them.

Expected root:

```text
grow-in-jesus-choir/
│
├── public/
├── src/
├── database/
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── eslint.config.mjs
```

Do not create random root-level directories.

---

# 6. PUBLIC DIRECTORY

All public static assets belong inside:

```text
public/
```

Recommended structure:

```text
public/
├── favicon.ico
├── favicon.svg
├── apple-touch-icon.png
├── robots.txt
├── sitemap.xml
├── manifest.webmanifest
│
├── images/
│   ├── brand/
│   │   ├── logo.svg
│   │   ├── logo-mark.svg
│   │   └── og-image.png
│   │
│   ├── choir/
│   └── backgrounds/
│
├── icons/
│   ├── social/
│   └── interface/
│
└── animations/
    └── lottie/
```

Public assets must not be scattered throughout the source tree.

Use `public/` for files that are meant to be publicly served.

Examples:

- Favicons
- Logos
- Static images
- Social preview images
- Robots
- Sitemap
- Manifest
- Lottie JSON assets where appropriate
- Static icons
- Public backgrounds

Do not put SQL files inside `public`.

Do not put source code inside `public`.

Do not put private financial documents inside `public`.

Sensitive uploaded files must use secure storage rather than public static assets.

---

# 7. SRC DIRECTORY

All application code must live under:

```text
src/
```

Recommended architecture:

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── hooks/
├── services/
├── types/
├── config/
└── middleware.ts
```

Keep responsibilities clearly separated.

---

# 8. APP DIRECTORY

Use the application routing structure to represent the user experience.

Recommended structure:

```text
src/app/
│
├── (public)/
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   └── ...
│
├── (dashboard)/
│   ├── dashboard/
│   ├── finances/
│   ├── members/
│   ├── reports/
│   ├── activity/
│   ├── documents/
│   └── settings/
│
├── api/
│
├── layout.tsx
├── globals.css
└── not-found.tsx
```

Route groups may be used to keep URLs clean.

Do not create unnecessary route nesting.

The URLs should remain human-readable.

Examples:

```text
/login
/dashboard
/finances
/finances/income
/finances/expenses
/members
/reports
/activity
/documents
/settings
```

---

# 9. COMPONENT ARCHITECTURE

Reusable interface components must live inside:

```text
src/components/
```

Recommended structure:

```text
src/components/
├── ui/
├── layout/
├── navigation/
├── dashboard/
├── finance/
├── members/
├── reports/
└── animations/
```

The `ui` directory contains generic reusable design-system components.

Examples:

```text
Button
Input
Select
Textarea
Dialog
Modal
Drawer
Card
Badge
Avatar
Tooltip
Dropdown
Tabs
Table
Pagination
Skeleton
Toast
EmptyState
DatePicker
CurrencyInput
```

These components should not contain business-specific financial logic.

For example:

A generic `Button` belongs in:

```text
src/components/ui/Button.tsx
```

A financial `AddExpenseButton` may belong in:

```text
src/components/finance/
```

Keep generic UI separate from domain-specific UI.

---

# 10. FEATURES DIRECTORY

Major business functionality should be organized under:

```text
src/features/
```

Recommended:

```text
src/features/
├── auth/
├── finances/
├── members/
├── reports/
├── notifications/
└── documents/
```

Each feature can contain its own:

- components
- schemas
- actions
- hooks
- types
- constants
- utilities

Do not force unrelated business logic into generic utility files.

The goal is maintainability.

---

# 11. LIB DIRECTORY

Use:

```text
src/lib/
```

for shared technical infrastructure.

Recommended:

```text
src/lib/
├── db/
├── auth/
├── permissions/
├── validation/
├── utils/
└── constants/
```

Database connection code may live under:

```text
src/lib/db/
```

But SQL migration files must remain under:

```text
database/
```

Never mix database schema files into application source code.

---

# 12. DATABASE DIRECTORY

All database-related source files must live inside:

```text
database/
```

Recommended:

```text
database/
├── migrations/
├── seeds/
├── functions/
├── triggers/
├── views/
└── README.md
```

Migration naming must be sequential and understandable.

Example:

```text
001_initial_schema.sql
002_users.sql
003_roles.sql
004_members.sql
005_financial_categories.sql
006_financial_records.sql
007_contributions.sql
008_expenses.sql
009_documents.sql
010_notifications.sql
011_audit_logs.sql
```

Never use meaningless names such as:

```text
test.sql
final.sql
new.sql
final-final.sql
update.sql
```

Database history must remain understandable.

Never modify an already-applied production migration.

Create a new migration when the schema changes.

---

# 13. DATABASE DESIGN PRINCIPLES

The database must be designed for:

- Data integrity
- Security
- Auditability
- Extensibility
- Referential integrity
- Performance
- Clear relationships
- Future reporting
- Historical accuracy

Financial records should never simply be stored as arbitrary JSON without a clear relational structure.

Use proper normalized structures where appropriate.

Potential entities include:

```text
users
roles
members
financial_categories
financial_records
contributions
expenses
documents
notifications
audit_logs
settings
```

The final schema must be based on actual product requirements.

Do not invent unnecessary complexity.

---

# 14. FINANCIAL RECORD MODEL

A financial record should capture sufficient information to understand what happened.

Potential attributes include:

- ID
- Type
- Amount
- Currency
- Category
- Member/user reference where applicable
- Date
- Description
- Status
- Created by
- Created at
- Updated by
- Updated at
- Approval information
- Related document/receipt
- Notes
- Reference number

The system must maintain timestamps.

Use server-side timestamps where appropriate.

Do not trust timestamps supplied by the browser for audit-critical information.

---

# 15. MONEY HANDLING

Financial amounts are critical.

Never use floating-point arithmetic carelessly for monetary values.

Use an appropriate exact monetary representation, such as integer minor units or a database decimal/numeric type depending on the chosen architecture.

The displayed currency should be configurable.

The initial interface may use:

**RWF**

and display values such as:

```text
50,000 RWF
1,845,000 RWF
```

Do not display raw database numbers directly.

Create reusable currency formatting utilities.

Example conceptual function:

```text
formatCurrency(amount, currency)
```

All currency displays should use consistent formatting.

---

# 16. FINANCIAL CATEGORIES

The application should support categories for income and expenses.

Examples:

Income:

- Member Contributions
- Donations
- Events
- Fundraising
- Other Income

Expenses:

- Transport
- Equipment
- Events
- Music
- Venue
- Communication
- Administration
- Other Expense

Do not hard-code categories throughout the interface.

Categories should come from a centralized configuration or database structure where appropriate.

---

# 17. DASHBOARD DESIGN

The dashboard is the most important screen.

It must answer four questions immediately:

1. How much money do we have?
2. How much came in?
3. How much was spent?
4. What needs attention?

The first viewport should contain the most important information.

Suggested layout:

```text
Good morning, Sarah 👋

Here's your choir's financial picture.

[ Current Balance ]
[ Income ]
[ Expenses ]
[ Pending ]

Financial Activity
[ Animated Chart ]

Recent Activity
[ Activity Feed ]

Financial Insight
[ Insight Card ]
```

Do not overcrowd the dashboard.

White space is important.

---

# 18. FINANCIAL PULSE

Create a signature visual component called:

**Financial Pulse**

This is a premium visualization representing the current financial state.

It may contain:

- Current balance
- Financial health status
- Income trend
- Expense trend
- Contribution activity

It should use subtle animation.

Example:

```text
FINANCIAL PULSE

     ◉

Healthy

1,845,000 RWF
```

The visual should feel alive but not distracting.

The component must remain understandable without animation.

If animation is disabled, the same information must still be visible.

---

# 19. FINANCIAL INSIGHTS

The dashboard should eventually provide simple understandable insights.

Examples:

> Your income increased compared with last month.

> Spending is higher than usual this month.

> 42 of 50 members have recorded their monthly contribution.

> Equipment is your largest expense category this month.

Insights must be based on actual data.

Never fabricate insights.

If insufficient data exists, show:

> Not enough information yet to provide an insight.

Do not display misleading analytics.

---

# 20. MEMBER DASHBOARD

The member dashboard should be much simpler than the leader dashboard.

Example:

```text
Good morning, John 👋

Your contributions

50,000 RWF

✓ October contribution recorded

Recent history

October
50,000 RWF

September
50,000 RWF

August
50,000 RWF

[ + Add Contribution ]
```

The member should not see administrative metrics that do not concern them.

---

# 21. LEADER DASHBOARD

The leader dashboard should provide organizational visibility.

Potential sections:

```text
Financial Overview

Current Balance
Income
Expenses
Pending Records

Financial Activity

Contribution Progress

Recent Transactions

Financial Insights

Records Requiring Attention
```

Use progressive disclosure.

The overview should remain simple while deeper details are available through navigation.

---

# 22. ADD RECORD EXPERIENCE

The most important interaction should be:

```text
+ Add Record
```

When clicked, present a simple choice:

```text
What would you like to record?

[ Money Received ]

[ Money Spent ]
```

Do not immediately expose a huge form.

Progressively reveal relevant fields.

For money received:

```text
Amount
Category
Member
Date
Description
Receipt
```

For money spent:

```text
Amount
Category
Date
Description
Receipt
```

Use intelligent defaults where safe.

For example, default the date to today.

Never silently choose an important financial category.

---

# 23. FORM DESIGN

Forms must be extremely friendly.

Requirements:

- Clear labels
- Helpful placeholders
- Inline validation
- Error messages near the field
- Keyboard accessibility
- Mobile-friendly controls
- Large touch targets
- Clear required/optional indicators
- Save state
- Loading state
- Success state
- Error recovery

Bad:

> Invalid input.

Good:

> Please enter an amount greater than 0.

Do not make users guess what went wrong.

---

# 24. SAVE CONFIRMATION

After saving a financial record, show a strong confirmation.

Example:

```text
✓ Record saved

50,000 RWF

October contribution

Your financial record has been successfully saved.
```

Use a subtle Lottie or motion animation.

The animation should not delay completion.

The user should be able to continue immediately.

---

# 25. TABLE DESIGN

Tables are useful for leaders but should not dominate the entire interface.

Financial records should support:

- Date
- Type
- Category
- Amount
- Person
- Status
- Actions

Use visual hierarchy.

Example:

```text
Date       Type       Category          Amount
07 Oct     Income     Contribution      +50,000 RWF
06 Oct     Expense    Transport         -30,000 RWF
05 Oct     Income     Donation          +100,000 RWF
```

Use clear positive/negative semantics.

Do not rely solely on color.

---

# 26. MOBILE DESIGN

Mobile is not an afterthought.

Many users may use phones as their primary device.

Design for:

- Small screens
- Touch interaction
- Slow networks
- Portrait orientation
- Limited horizontal space

On mobile:

- Tables may become cards
- Sidebar becomes bottom navigation or drawer
- Add Record becomes a prominent action
- Charts simplify
- Secondary information collapses

Never make users horizontally scroll through a massive desktop table if a mobile card layout is more appropriate.

---

# 27. RESPONSIVE BREAKPOINTS

Use responsive design based on content rather than arbitrary device names.

The system should work well across:

- Small phones
- Large phones
- Tablets
- Laptops
- Desktop monitors
- Large displays

Do not optimize only for one specific device.

---

# 28. DESIGN SYSTEM

Create a consistent design system before creating dozens of unique components.

Define:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Borders
- Elevation
- Motion
- Icons
- Buttons
- Inputs
- Cards
- Tables
- Status indicators

Use design tokens.

Example conceptual tokens:

```text
background
surface
surface-elevated
text-primary
text-secondary
text-muted
border
primary
success
warning
danger
```

Avoid hard-coded visual values throughout the application.

---

# 29. LIGHT MODE

The platform is primarily a light-mode application.

The base visual environment should be bright, clean, and premium.

Avoid pure white everywhere.

Use subtle tonal variation.

For example:

```text
Page background
Soft off-white

Cards
White

Secondary surfaces
Very light neutral

Borders
Extremely subtle

Text
Deep neutral

Accent
Controlled futuristic color
```

The application must maintain excellent contrast.

Do not sacrifice accessibility for aesthetics.

---

# 30. FUTURISTIC VISUAL LANGUAGE

The futuristic visual language should come from:

- Precision
- Spacing
- Motion
- Subtle gradients
- Spatial transitions
- Soft depth
- Data visualization
- Interactive feedback
- Ambient backgrounds
- Elegant typography

Do not rely on excessive neon.

Do not make every component glow.

Do not use excessive glassmorphism.

Do not turn the platform into a sci-fi movie interface.

The user must still trust the financial information.

---

# 31. MOTION DESIGN

Motion is a first-class design system feature.

Use animation purposefully.

Animation should communicate:

- Where something came from
- Where something went
- What changed
- What was successful
- What needs attention
- What is loading

Do not animate simply because animation is possible.

---

# 32. GSAP

Use GSAP for sophisticated animation sequences.

Potential use cases:

- Landing page entrance
- Dashboard reveal
- Financial Pulse
- Chart transitions
- Number animations
- Hero transitions
- Spatial page transitions
- Signature interactions

Do not use GSAP for every simple button interaction.

Keep simple UI transitions lightweight.

---

# 33. MOTION / FRAMER MOTION

Use Motion/Framer Motion where appropriate for:

- Component entrance
- Layout changes
- Dialogs
- Dropdowns
- Toasts
- Hover interactions
- Shared layout transitions
- Mobile navigation

Do not create conflicting animation systems unnecessarily.

Establish a clear rule for when GSAP is used versus when Motion is used.

---

# 34. LOTTIE

Use Lottie for illustrative animations.

Potential assets:

```text
record-success.json
empty-state.json
welcome.json
upload-success.json
notification.json
```

Lottie animations should be lightweight.

Do not use enormous animation files.

Optimize assets.

---

# 35. THREE.JS

Three.js should be used selectively.

Potential applications:

- Financial Pulse
- Ambient visual background
- Signature dashboard visualization
- Landing page visual

Do not use Three.js for basic UI.

Do not make WebGL required for the platform to function.

Provide graceful degradation.

Users with:

- reduced motion
- low-power devices
- unsupported WebGL
- accessibility settings

must still have the complete application experience.

---

# 36. REDUCED MOTION

Respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled:

- Disable decorative movement
- Reduce transitions
- Remove unnecessary parallax
- Stop continuous animations
- Keep functional feedback
- Keep instant state changes understandable

Accessibility is more important than visual spectacle.

---

# 37. ANIMATION PERFORMANCE

Never block the main user experience with animation.

Avoid:

- Huge JavaScript animation bundles
- Continuous expensive WebGL
- Excessive blur
- Unnecessary particle systems
- Layout thrashing
- Large DOM animation sequences

Prefer:

- Transform
- Opacity
- GPU-friendly properties
- Lazy loading
- Dynamic imports
- Reduced complexity on mobile

The dashboard must remain fast.

---

# 38. AUTHENTICATION

Authentication must be secure and production-ready.

Support:

- Secure login
- Session management
- Logout
- Protected routes
- Role checks
- Unauthorized access handling

Never trust role information sent by the client.

Authorization must be enforced server-side.

A member must not become a leader simply by changing browser state.

---

# 39. AUTHORIZATION

Use centralized authorization logic.

For example conceptually:

```text
canViewFinance()
canCreateRecord()
canEditRecord()
canDeleteRecord()
canApproveRecord()
canManageMembers()
canViewAuditLog()
```

Do not scatter role checks randomly throughout components.

Authorization must be predictable and testable.

---

# 40. AUDIT LOG

Financial systems require accountability.

Important changes should be recorded.

Audit events may include:

- Record created
- Record edited
- Record deleted/voided
- Record approved
- Record rejected
- Member created
- Member updated
- Role changed
- Document uploaded
- Document removed

Store:

- Actor
- Action
- Target
- Timestamp
- Relevant metadata

Do not expose technical audit information unnecessarily to members.

Leaders/admins can have appropriate access.

---

# 41. RECORD DELETION

Do not casually hard-delete financial records.

For important financial records, prefer a controlled process such as:

- Void
- Archive
- Mark as corrected
- Record correction

The exact behavior should be determined during requirements analysis.

The system should preserve historical accountability.

---

# 42. RECEIPTS AND DOCUMENTS

The platform should eventually support receipts and financial documents.

Users may upload:

- Receipt images
- PDFs
- Supporting documents

But these must not simply be placed in:

```text
public/
```

Private financial documents must use secure storage.

Access must be permission-controlled.

Validate:

- File type
- File size
- Upload authorization
- Storage path
- Access permissions

Do not allow arbitrary executable files.

---

# 43. NOTIFICATIONS

Notifications should be useful, not noisy.

Potential notifications:

- Contribution submitted
- Record approved
- Record rejected
- Financial record updated
- Important announcement
- Monthly reminder

Provide a notification center.

Example:

```text
Notifications

● Your October contribution was recorded.

● Expense report approved.

○ Monthly contribution reminder.
```

Use priority levels.

Do not create notification spam.

---

# 44. REPORTS

Reports should help leaders understand the organization.

Potential reports:

- Income report
- Expense report
- Contribution report
- Monthly summary
- Financial activity
- Member contribution status

Reports should support useful filters:

- Date range
- Category
- Member
- Record type
- Status

Export may eventually support:

- CSV
- PDF

Do not build complex reporting before the underlying financial model is correct.

---

# 45. SEARCH

Provide search where it actually helps.

Search may cover:

- Financial records
- Members
- Categories
- Documents

Search should be fast and forgiving.

Do not require exact database values.

---

# 46. EMPTY STATES

Empty states are part of the design.

Do not display blank screens.

Example:

```text
No financial records yet

Once your choir records its first transaction,
it will appear here.

[ Add First Record ]
```

Use a subtle illustration or Lottie animation when appropriate.

---

# 47. LOADING STATES

Use skeleton loaders instead of freezing the interface.

Examples:

```text
Balance
██████████

Income
██████████

Recent activity
████████████████
████████████████
```

Avoid showing blank white screens.

---

# 48. ERROR STATES

Errors should be human-readable.

Bad:

> 500 Internal Server Error

Better:

> We couldn't load your financial records.

Then:

> Please try again.

Button:

```text
[ Try Again ]
```

Do not expose internal stack traces to users.

Log technical errors securely.

---

# 49. SUCCESS STATES

Every important action should have clear feedback.

Examples:

- Record saved
- Record updated
- Report generated
- Member added
- Receipt uploaded
- Password changed

Feedback should be immediate.

---

# 50. ACCESSIBILITY

Accessibility is mandatory.

Follow good accessibility practices:

- Semantic HTML
- Keyboard navigation
- Focus states
- Proper labels
- ARIA only where necessary
- Sufficient color contrast
- Accessible forms
- Screen-reader-friendly status messages
- Reduced motion support
- Large enough touch targets

Do not use color as the only indicator.

For example, an expense should not be identified only by red.

Use:

```text
− 50,000 RWF
```

alongside visual semantics.

---

# 51. TYPOGRAPHY

Typography must prioritize readability.

Possible font direction:

- Inter
- Manrope
- Plus Jakarta Sans
- Satoshi

Choose a coherent system.

Define:

- Display
- Heading 1
- Heading 2
- Heading 3
- Body
- Small
- Caption
- Numeric/display values

Financial numbers should be visually prominent.

---

# 52. ICONOGRAPHY

Use one coherent icon system.

Do not mix random icon libraries without reason.

Icons should support comprehension.

Examples:

- Home
- Finance
- Members
- Reports
- Activity
- Documents
- Settings
- Bell
- Plus
- Arrow
- Check
- Warning

Do not replace labels with icons when meaning becomes ambiguous.

---

# 53. DASHBOARD CARDS

Cards should not become an excuse for excessive fragmentation.

A card should exist because it represents a meaningful unit of information.

Good:

```text
Current Balance
1,845,000 RWF
```

Bad:

```text
Card 1
Card 2
Card 3
Card 4
Card 5
Card 6
```

Keep the visual hierarchy strong.

---

# 54. FINANCIAL CHARTS

Charts should answer questions.

Examples:

### Income vs Expense

Shows financial movement over time.

### Contribution progress

Shows how many members have contributed.

### Expense breakdown

Shows where money is being spent.

Avoid decorative charts with no meaning.

Charts must have accessible textual summaries.

For example:

> Income was 680,000 RWF and expenses were 245,000 RWF this month.

---

# 55. DATA VISUALIZATION PRINCIPLES

Do not distort data.

Do not use misleading 3D charts.

Do not use excessive gradients that make values difficult to compare.

Do not make tiny differences look huge.

Use:

- Clear axes
- Labels
- Tooltips
- Appropriate scales
- Simple legends

The futuristic visual style must never compromise financial accuracy.

---

# 56. LANDING PAGE

The public landing page should introduce the platform and organization.

It should not expose private financial information.

Possible sections:

```text
Hero
↓
About Grow in Jesus Choir
↓
Platform capabilities
↓
Financial stewardship message
↓
Simple workflow
↓
Call to action
```

The hero can contain sophisticated animation.

Use GSAP for entrance and spatial motion.

Do not create a giant marketing page if the product does not require one.

---

# 57. BRAND INTEGRATION

The platform must feel connected to Grow in Jesus Choir.

Use the organization's identity, logo, imagery, and values where appropriate.

Do not invent a completely unrelated corporate identity.

The design should communicate:

- Faith
- Stewardship
- Unity
- Trust
- Transparency
- Organization
- Growth

The interface should remain professional rather than overly decorative.

---

# 58. CONTENT LANGUAGE

The interface must use simple language.

Examples:

Instead of:

> Financial transaction management

Use:

> Financial records

Instead of:

> User account configuration

Use:

> Account settings

Instead of:

> Transaction reconciliation status

Use:

> Record status

Instead of:

> Execute transaction

Use:

> Save record

Always ask:

> Would a non-technical choir member understand this immediately?

If not, simplify it.

---

# 59. INTERNATIONALIZATION READINESS

Even if the first version uses English, structure the application so future localization is possible.

Avoid scattering user-facing strings across arbitrary code.

Prepare for future languages.

Potential future languages may include:

- English
- Kinyarwanda
- French

Do not build a full translation system unless needed immediately, but avoid architecture that makes localization impossible.

---

# 60. DATE AND TIME

Dates should be formatted consistently.

Use a centralized date formatting utility.

Do not manually format dates differently throughout the application.

The platform should respect the organization's timezone.

Server-side timestamps should remain reliable.

---

# 61. SECURITY PRINCIPLES

Treat all financial data as sensitive.

Implement:

- Server-side authorization
- Input validation
- Secure sessions
- Protected APIs
- Database constraints
- Rate limiting where appropriate
- Secure file uploads
- Audit logging
- Safe error handling
- Environment secrets
- HTTPS in production
- Secure headers
- CSRF protection where applicable
- Protection against injection attacks

Never expose:

- Database credentials
- API secrets
- Private environment variables
- Internal stack traces

to the client.

---

# 62. ENVIRONMENT VARIABLES

Secrets must be stored in environment variables.

Provide:

```text
.env.example
```

but never commit real secrets.

Example conceptual variables:

```text
DATABASE_URL=
AUTH_SECRET=
STORAGE_URL=
STORAGE_KEY=
```

Use appropriate secret management in production.

---

# 63. API DESIGN

API endpoints should be predictable.

Use resource-oriented naming.

Conceptual examples:

```text
/api/finances
/api/finances/income
/api/finances/expenses
/api/members
/api/reports
/api/notifications
```

Validate all input.

Never trust client-supplied role information.

Return consistent error structures.

---

# 64. SERVER AND CLIENT RESPONSIBILITIES

Do not make everything client-side.

Sensitive operations should run on the server.

Prefer server-side data fetching for protected financial data when appropriate.

Use client components only when interactivity requires them.

Avoid turning the entire application into a giant client-rendered component.

---

# 65. PERFORMANCE

Performance is a product requirement.

Target:

- Fast initial load
- Small JavaScript payloads
- Optimized images
- Lazy-loaded heavy components
- Dynamic loading for Three.js
- Optimized Lottie assets
- Efficient database queries
- Pagination for large datasets
- Caching where appropriate

Three.js and heavy animation libraries should not unnecessarily slow down the entire application.

---

# 66. MOBILE PERFORMANCE

On mobile:

- Reduce decorative animation
- Avoid unnecessary WebGL
- Reduce particle counts
- Lazy-load charts
- Compress images
- Minimize network requests

The platform must remain useful on modest hardware.

---

# 67. OFFLINE / POOR NETWORK CONSIDERATION

The initial architecture should consider unreliable connections.

Where appropriate:

- Preserve unsaved form input
- Provide clear loading state
- Provide retry behavior
- Avoid losing user-entered information
- Show connection-related errors clearly

Do not claim a record was saved until the server confirms it.

---

# 68. DATA VALIDATION

Use schema-based validation.

Validate on:

1. Client for immediate feedback
2. Server for security/integrity

Never rely only on frontend validation.

Validate:

- Amount
- Date
- Category
- IDs
- File metadata
- Text length
- Permissions

---

# 69. DATABASE INTEGRITY

Use database constraints where appropriate.

Examples:

- Foreign keys
- Not-null constraints
- Unique constraints
- Check constraints
- Appropriate indexes

Do not rely entirely on application code for fundamental data integrity.

---

# 70. INDEXING

Create indexes based on actual query patterns.

Likely indexed fields may include:

- User ID
- Member ID
- Financial record date
- Category
- Type
- Status
- Created timestamp

Do not create indexes blindly.

---

# 71. AUDITABILITY

A financial system must answer:

> Who did this?

> What changed?

> When did it change?

> What was the previous state?

Where appropriate, preserve change history.

Do not make important financial modifications invisible.

---

# 72. UX FOR APPROVAL

If the workflow requires leaders to review submissions, make approval extremely clear.

Example:

```text
Pending record

50,000 RWF
Member contribution
John Doe
07 October 2026

[ Approve ]
[ Reject ]
```

Rejecting should require a reason if appropriate.

Do not hide approval actions inside obscure menus.

---

# 73. MEMBER CONTRIBUTION EXPERIENCE

A member should be able to understand their contribution status instantly.

Example:

```text
October

✓ Recorded

50,000 RWF
```

If not recorded:

```text
October

Contribution not recorded

[ Add Contribution ]
```

Do not use complicated accounting language.

---

# 74. LEADER CONTRIBUTION MONITORING

Leaders should be able to see:

```text
Monthly contribution progress

42 / 50 members

84%
```

Then allow drilling down:

```text
Recorded
42

Not recorded
8
```

The UI should make follow-up easy.

---

# 75. ACTIVITY FEED

Create a clear activity timeline.

Example:

```text
Today

10:42 AM
John added a contribution
50,000 RWF

09:31 AM
Sarah approved an expense
35,000 RWF

Yesterday

Mary submitted an expense
120,000 RWF
```

Use timeline motion subtly.

---

# 76. SEARCH AND FILTER UX

Filters should not overwhelm users.

Start with common filters:

```text
Date
Type
Category
Member
Status
```

Advanced filters may be hidden under:

> More filters

Provide a clear:

> Clear filters

state.

---

# 77. REPORT EXPORT

When generating an export:

```text
Preparing your report...
```

Then:

```text
Your report is ready.

[ Download Report ]
```

Do not freeze the page.

Large reports should be generated safely.

---

# 78. DESIGN FOR TRUST

Because this is financial software, every visual decision must increase trust.

Use:

- Clear numbers
- Consistent formatting
- Predictable interactions
- Transparent statuses
- Auditability
- Confirmation
- Professional typography
- Calm animation

Avoid:

- Fake loading
- Manipulative animation
- Confusing colors
- Hidden actions
- Ambiguous financial states

---

# 79. FUTURISTIC 2100 PRINCIPLE

The objective is not to literally imitate what someone thinks 2100 will look like.

The objective is to build a system whose **design principles will age well**.

That means:

- No trend-dependent gimmicks
- No excessive gradients
- No unnecessary 3D
- No unreadable futuristic fonts
- No excessive glass
- No confusing holographic UI

Instead:

> Timeless information architecture + advanced interaction design + elegant motion + intelligent visualization.

That is the definition of the "2100" aesthetic for this project.

---

# 80. MICROINTERACTIONS

Use microinteractions for:

- Button press
- Hover
- Input focus
- Checkbox
- Toggle
- Menu opening
- Toast appearance
- Record saved
- Status changes

Interactions should feel physical but subtle.

Avoid excessive bounce.

Avoid animation durations that make the system feel slow.

---

# 81. PAGE TRANSITIONS

Page transitions should communicate continuity.

Do not make every route perform a dramatic transition.

Use subtle transitions for normal navigation.

Reserve cinematic sequences for:

- Landing page
- First login
- Signature financial visualization
- Major state changes

---

# 82. SKELETONS AND PROGRESSIVE LOADING

Load important information first.

Example:

1. Dashboard shell
2. Current balance
3. Income/expense summary
4. Recent activity
5. Charts
6. Secondary information

Heavy visualizations may load after essential information.

Never make users wait for decorative content before seeing their balance.

---

# 83. ERROR RECOVERY

Every failure should offer a next action.

Examples:

```text
Couldn't load records.

[ Try again ]
```

or:

```text
Your connection appears to be unavailable.

Your entered information has been kept.

[ Retry ]
```

Do not simply show a red error banner and abandon the user.

---

# 84. CODE QUALITY

Code must be:

- Typed
- Modular
- Readable
- Testable
- Documented where necessary
- Consistent
- Maintainable

Avoid:

- Giant components
- Giant functions
- Copy-pasted logic
- Magic values
- Unnecessary abstractions
- Premature optimization
- Dead code

---

# 85. TYPESCRIPT

Use TypeScript strictly.

Avoid:

```text
any
```

unless absolutely unavoidable.

Define meaningful types.

Separate:

- Database types
- Domain types
- UI types
- API types

Do not allow database implementation details to leak everywhere.

---

# 86. NAMING

Use descriptive names.

Good:

```text
FinancialSummaryCard
ContributionProgress
CreateExpenseForm
FinancialRecordTable
```

Bad:

```text
Thing
Box
Data
Stuff
Helper2
NewComponent
```

Naming should communicate purpose.

---

# 87. COMPONENT SIZE

If a component becomes difficult to understand, split it.

A dashboard should not become a 1,500-line file.

Break it into meaningful units.

For example:

```text
DashboardPage
├── DashboardHeader
├── FinancialSummary
├── FinancialPulse
├── FinancialChart
├── ContributionProgress
├── RecentActivity
└── FinancialInsight
```

---

# 88. TESTING

Testing is required.

At minimum, test:

### Unit tests

- Currency formatting
- Permission checks
- Validation
- Financial calculations
- Date formatting

### Integration tests

- Create financial record
- Edit record
- Approve record
- Member contribution
- Authentication

### End-to-end tests

Important flows:

```text
Login
↓
Dashboard
↓
Add contribution
↓
Save
↓
View history
```

and:

```text
Leader login
↓
Dashboard
↓
Review pending record
↓
Approve
↓
Verify financial totals
```

---

# 89. FINANCIAL CALCULATION TESTS

Financial calculations require especially strong tests.

Test:

- Zero income
- Zero expenses
- Income only
- Expenses only
- Multiple records
- Same-day records
- Large values
- Decimal values if supported
- Different categories
- Reversed/voided records
- Date ranges

Never assume simple arithmetic does not need testing.

---

# 90. SECURITY TESTING

Test:

- Unauthorized member accessing leader routes
- Unauthorized API calls
- Invalid IDs
- Manipulated requests
- File upload restrictions
- Session expiration
- Role escalation attempts
- Invalid financial amounts
- Injection attempts

Security must be tested at the server/API level.

---

# 91. ACCESSIBILITY TESTING

Test:

- Keyboard navigation
- Screen readers where practical
- Focus visibility
- Contrast
- Reduced motion
- Form labels
- Error messages
- Mobile touch targets

Do not consider accessibility finished merely because the UI looks good.

---

# 92. BROWSER SUPPORT

Test the modern application across major browsers.

At minimum consider:

- Chrome
- Edge
- Safari
- Firefox
- Mobile Safari
- Android browsers

Do not rely on experimental browser features without graceful fallback.

---

# 93. DOCUMENTATION

Maintain a project README.

It should explain:

- What the project is
- How to install it
- How to run development
- Environment variables
- Database setup
- Migration process
- Testing
- Build
- Deployment
- Architecture
- Contribution conventions

Also document the database architecture inside:

```text
database/README.md
```

---

# 94. GIT DISCIPLINE

Use meaningful commits.

Examples:

```text
feat: add member contribution workflow
feat: add leader financial dashboard
fix: correct monthly balance calculation
refactor: extract financial summary components
docs: update database setup
```

Do not use meaningless commits such as:

```text
update
fix
stuff
changes
final
```

---

# 95. DEVELOPMENT ORDER

Do not build random screens.

Follow this order.

## Phase 1 — Discovery

Understand the actual financial workflow.

## Phase 2 — Architecture

Finalize:

- User roles
- Permissions
- Database entities
- Routes
- Major workflows

## Phase 3 — Design system

Create:

- Colors
- Typography
- Components
- Motion principles
- Layout system

## Phase 4 — Authentication

Build:

- Login
- Session
- Protected routes
- Role permissions

## Phase 5 — Database foundation

Create migrations and seed data.

## Phase 6 — Member experience

Build member workflows.

## Phase 7 — Leader experience

Build financial dashboard and management.

## Phase 8 — Reports

Build reporting and exports.

## Phase 9 — Documents

Add receipt/document support.

## Phase 10 — Motion and futuristic layer

Add:

- GSAP
- Motion
- Lottie
- Three.js

only after functional UI is stable.

## Phase 11 — Testing

Perform full testing.

## Phase 12 — Performance and accessibility

Optimize.

## Phase 13 — Production readiness

Security review, deployment, monitoring, backups.

---

# 96. DO NOT START WITH DECORATIVE ANIMATION

This is extremely important.

Do not spend the first development stage building:

- 3D backgrounds
- Particle systems
- Fancy landing animations
- Glowing cards
- Experimental transitions

before the core financial workflow works.

First:

```text
Correct data
↓
Correct permissions
↓
Correct workflows
↓
Correct UX
↓
Correct visual system
↓
Motion
↓
Advanced effects
```

A beautiful financial platform with incorrect financial calculations is a failure.

---

# 97. PRODUCT PRIORITY ORDER

When trade-offs occur, prioritize:

1. Financial correctness
2. Security
3. Usability
4. Accessibility
5. Reliability
6. Performance
7. Maintainability
8. Visual polish
9. Advanced animation

Never sacrifice the first seven for visual effects.

---

# 98. DESIGN REVIEW RULE

Before implementing a new interface element, ask:

### Is it necessary?

If yes:

### Is it understandable?

If yes:

### Is it accessible?

If yes:

### Is it consistent with the design system?

If yes:

### Can it be simpler?

If no:

### Implement it.

---

# 99. NO GENERIC TEMPLATE DESIGN

Do not simply install a dashboard template and change the colors.

The final application should have a custom visual identity.

Avoid:

- Generic admin dashboard layouts
- Generic Bootstrap appearance
- Default component-library appearance
- Random gradients
- Generic SaaS hero sections
- Overused glassmorphism
- Excessive rounded rectangles

Use component libraries only as implementation foundations when appropriate.

Customize them heavily.

---

# 100. DATA-FIRST DESIGN

Every visualization must be tied to actual data.

Do not create fake statistics in production.

During development, seed realistic demo data, but clearly separate seed/demo data from production data.

Example demo values:

```text
Income: 680,000 RWF
Expenses: 245,000 RWF
Balance: 1,845,000 RWF
Members: 50
Contributions recorded: 42
```

These are development examples only.

Production must display actual database values.

---

# 101. DATABASE MIGRATION DISCIPLINE

All schema changes must be represented in migrations.

Never manually modify production schema without documenting the change.

Each migration should be:

- Sequential
- Reproducible
- Reviewable
- Idempotency-aware where appropriate
- Tested

Document dangerous migrations.

---

# 102. SEED DATA

Development seed data should create a realistic environment.

Include:

- Sample leaders
- Sample members
- Income
- Expenses
- Contributions
- Categories
- Activity history

Do not use real people's private data in development.

Use obviously fictional/demo information.

---

# 103. ENVIRONMENT SEPARATION

Clearly separate:

```text
development
testing
staging
production
```

Never point local development accidentally at production financial data.

Use different credentials and databases.

---

# 104. LOGGING

Application logging should be useful without leaking sensitive information.

Never log:

- Passwords
- Authentication tokens
- Sensitive financial secrets
- Private credentials

Log enough information to diagnose system failures.

---

# 105. OBSERVABILITY

Production should eventually support:

- Error monitoring
- Application health
- Database health
- Performance monitoring
- Authentication failure monitoring

Do not expose monitoring tools to normal users.

---

# 106. BACKUPS

Financial data must have reliable backups.

The production architecture should include:

- Automated database backups
- Backup retention
- Recovery procedure
- Periodic restore testing

A backup that has never been tested is not enough.

---

# 107. FUTURE EXTENSIBILITY

The architecture should allow future modules such as:

- Choir events
- Attendance
- Member communication
- Donations
- Fundraising campaigns
- Budget planning
- Asset management
- Inventory
- Document management
- Financial forecasting

Do not build these now unless required.

However, avoid architecture that makes future growth impossible.

---

# 108. DO NOT OVERENGINEER

Future-proof does not mean building everything today.

Do not build:

- Microservices unnecessarily
- Complex event buses
- Kubernetes infrastructure
- Huge abstractions
- Multiple databases without need
- Complicated accounting engines

Start with a well-structured modular application.

Scale when actual requirements justify it.

---

# 109. USER EXPERIENCE PRINCIPLE

Whenever the user has to make a decision, ask:

> Can the application make this decision safely for them?

If yes, provide a sensible default.

Example:

Date:

```text
07 October 2026
```

should default to today.

But category should not automatically be guessed if doing so could cause a financial error.

---

# 110. CONFIRM DESTRUCTIVE ACTIONS

Actions that can cause meaningful data loss must require confirmation.

Example:

```text
Delete this record?

This action may affect financial reports.

[ Cancel ]
[ Continue ]
```

Where possible, use reversible operations rather than permanent deletion.

---

# 111. RESPONSIVE TABLE BEHAVIOR

On desktop, financial records can use tables.

On mobile, transform them into cards.

Example:

```text
07 Oct 2026
Member Contribution

John Doe
+50,000 RWF

Recorded
```

This is preferable to tiny unreadable table columns.

---

# 112. NOTIFICATION TOASTS

Toasts should be short.

Good:

> Record saved successfully.

Bad:

> Congratulations! Your financial record has successfully been submitted and processed by our advanced financial management system.

Keep feedback human.

---

# 113. EMPTY DASHBOARD

If a new choir has no data:

```text
Welcome to your financial dashboard.

Start by recording your first income or expense.

[ Add Record ]
```

Do not show empty charts with meaningless axes.

---

# 114. FIRST-TIME USER EXPERIENCE

For the first login, optionally provide a very short onboarding.

Example:

```text
Welcome 👋

Let's get your choir's finances organized.

1. Add members
2. Record financial activity
3. Monitor your dashboard
```

Do not force a long tutorial.

---

# 115. HELP SYSTEM

Provide contextual help where useful.

For example:

> What is Current Balance?

A tooltip can explain:

> The current balance is the total money received minus recorded expenses, based on the records currently in the system.

Use plain language.

---

# 116. DESIGN TOKENS

Centralize important visual values.

Conceptually:

```text
spacing-xs
spacing-sm
spacing-md
spacing-lg
spacing-xl

radius-sm
radius-md
radius-lg

shadow-sm
shadow-md
shadow-lg

motion-fast
motion-normal
motion-slow
```

This makes the entire platform visually consistent.

---

# 117. MOTION TOKENS

Create consistent animation timing.

For example conceptually:

```text
micro
fast
normal
slow
dramatic
```

Do not invent random durations for every animation.

Animation should feel like one coherent system.

---

# 118. FUTURISTIC BACKGROUNDS

Ambient backgrounds may use:

- Very subtle gradient movement
- Soft radial light
- Fine grid
- Low-opacity particles
- Organic geometry

But these must never interfere with text readability.

Use them sparingly.

---

# 119. GLASSMORPHISM

If glass effects are used:

- Keep opacity controlled
- Maintain contrast
- Avoid excessive backdrop blur
- Provide fallback
- Do not use glass on every card

Glass should be a premium accent.

---

# 120. THREE.JS FALLBACK

Every Three.js visual must have a fallback.

For example:

```text
Three.js Financial Pulse
        ↓
WebGL available?
   ↙           ↘
 YES            NO
  ↓              ↓
3D visual     2D visual
```

The financial information must always remain accessible.

---

# 121. ACCESSIBLE CHART FALLBACK

Charts must have text alternatives.

For example:

> Income increased from 520,000 RWF in September to 680,000 RWF in October.

This ensures users are not dependent on visual charts.

---

# 122. FORM AUTOSAVE

For long forms, consider preserving temporary input locally.

However:

Do not treat locally saved input as a confirmed financial record.

Clearly distinguish:

```text
Saved locally
```

from:

```text
Saved successfully
```

---

# 123. DATA REFRESH

Financial information should not silently become stale.

Use appropriate data revalidation.

After adding a record:

```text
Save
↓
Server confirms
↓
Dashboard totals update
↓
Activity feed updates
```

The user should immediately see the result.

---

# 124. CONSISTENCY

If the application calls something:

> Contribution

do not later call it:

> Payment

unless they are genuinely different concepts.

Create a product vocabulary and use it consistently.

Core vocabulary should include:

- Member
- Leader
- Contribution
- Income
- Expense
- Financial record
- Balance
- Report
- Receipt
- Activity

---

# 125. DO NOT HIDE CRITICAL INFORMATION

Do not hide:

- Current balance
- Record status
- Approval state
- Financial errors
- Important warnings

The user should understand the current state.

---

# 126. SECURITY VS UX

Security should be strong without making the interface painful.

Do not ask users to repeatedly authenticate without reason.

But sensitive operations may require additional verification depending on the final security model.

Use clear language.

---

# 127. LEADER SETTINGS

Leader settings may include:

- Choir profile
- Currency
- Financial categories
- Contribution settings
- Notification preferences
- User permissions
- Reporting configuration

Do not expose dangerous settings without appropriate authorization.

---

# 128. PROFILE

Member profile:

```text
Name
Email/phone where applicable
Profile image
Contribution history
Account settings
```

Leader profile may include additional organizational permissions.

---

# 129. NAVIGATION

Desktop navigation:

```text
Overview
Finances
Members
Reports
Activity
Documents
Settings
```

Do not overload navigation.

Use grouping if necessary:

```text
MAIN
Overview
Finances
Members

INSIGHTS
Reports
Activity

MANAGE
Documents
Settings
```

---

# 130. SEARCH BAR

The global search can eventually provide:

```text
Search records, members, reports...
```

Keyboard shortcut may eventually be:

```text
⌘ K
```

or:

```text
Ctrl K
```

But only implement this if useful.

Do not add shortcuts merely to look advanced.

---

# 131. DESIGN DETAILS

Small details matter:

- Correct line height
- Consistent icon size
- Proper alignment
- Strong whitespace
- Subtle borders
- Meaningful shadows
- Smooth hover
- Excellent empty states
- Consistent button height
- Clear focus states

The platform should feel polished at every level.

---

# 132. NO DARK MODE INITIALLY

The primary design target is light mode.

If dark mode is eventually introduced, it should be a fully designed theme rather than an automatic inversion.

Do not build a poor dark mode just because dark mode exists in other applications.

---

# 133. SEO

Public-facing pages should have proper:

- Title
- Description
- Open Graph metadata
- Social preview image
- Canonical URLs where applicable
- Robots
- Sitemap
- Structured metadata where appropriate

Static SEO files belong in:

```text
public/
```

Metadata implementation belongs in:

```text
src/app/
```

---

# 134. FAVICON AND BRAND ASSETS

Keep:

```text
public/favicon.ico
public/favicon.svg
public/apple-touch-icon.png
```

Brand assets:

```text
public/images/brand/
```

Do not duplicate logos unnecessarily.

Use one source of truth where possible.

---

# 135. DOCUMENTATION OF DESIGN SYSTEM

Create design documentation explaining:

- Color system
- Typography
- Spacing
- Components
- Motion
- Accessibility
- Do/don't examples

This is important for future developers.

---

# 136. COMPONENT REUSE

If two screens need the same behavior, reuse the same component.

Do not duplicate:

```text
BalanceCard
```

into:

```text
LeaderBalanceCard
MemberBalanceCard
DashboardBalanceCard
FinanceBalanceCard
```

unless their responsibilities genuinely differ.

---

# 137. BUSINESS LOGIC SEPARATION

Business calculations should not live inside JSX.

Bad conceptual pattern:

```text
component renders and calculates everything
```

Better:

```text
data/service layer
      ↓
domain calculation
      ↓
UI component
```

This makes calculations testable.

---

# 138. FINANCIAL SUMMARY CALCULATION

The system should centralize financial calculations.

Conceptually:

```text
Total Income
Total Expenses
Current Balance
Contribution Total
Pending Amount
```

These values should have one authoritative implementation.

Avoid calculating the same concept differently on different screens.

---

# 139. REPORT CONSISTENCY

Dashboard balance and report balance must use the same business rules.

If the dashboard says:

```text
1,845,000 RWF
```

and the report says:

```text
1,820,000 RWF
```

without an explanation, users will lose trust.

Create centralized financial calculation rules.

---

# 140. TIME PERIODS

Reports should eventually support:

- Today
- This week
- This month
- Last month
- This year
- Custom range

The interface should make date filtering easy.

---

# 141. FINANCIAL STATUS

Possible statuses:

```text
Draft
Pending
Approved
Rejected
Recorded
Voided
```

Only use statuses that are actually needed.

Avoid unnecessary workflow states.

---

# 142. VISUAL STATUS

Status should combine:

- Text
- Icon
- Appropriate color
- Optional animation

Never rely on color alone.

Example:

```text
✓ Approved
⏳ Pending
! Needs review
× Rejected
```

---

# 143. DOCUMENT PREVIEW

Where supported, receipts should be previewable without forcing users to download them.

Use appropriate secure access.

Do not expose private documents publicly.

---

# 144. RESPONSIVE MODALS

Dialogs must work on mobile.

On small screens:

- Full-width
- Bottom sheet where appropriate
- Easy close
- Large buttons

Avoid desktop-sized tiny dialogs on phones.

---

# 145. TOUCH INTERACTION

Buttons and interactive elements should be comfortable to tap.

Do not create tiny icon-only controls for critical actions.

If using icon-only buttons, provide:

- Tooltip
- Accessible label
- Adequate hit area

---

# 146. DATA PRIVACY

Only expose information necessary for the user's role.

A member should not automatically be able to inspect another member's financial history.

Privacy should be enforced at the server/database level.

---

# 147. DATABASE ACCESS

Never allow the browser to directly access privileged database credentials.

Use a secure backend/data access layer.

All protected operations should pass through authorization.

---

# 148. NO SECRET IN FRONTEND

Never put:

```text
DATABASE_PASSWORD
PRIVATE_API_KEY
AUTH_SECRET
```

in client-side code.

Environment variables intended for the server must remain server-only.

---

# 149. DEPLOYMENT

The application should be deployable using a modern production hosting environment.

The exact provider may be chosen later.

Deployment must support:

- HTTPS
- Environment variables
- Database connection
- File storage
- Build process
- Monitoring
- Backups

---

# 150. PRODUCTION CHECKLIST

Before production:

```text
[ ] Authentication tested
[ ] Authorization tested
[ ] Database migrations verified
[ ] Financial calculations tested
[ ] Audit logging verified
[ ] File uploads secured
[ ] Environment variables configured
[ ] Backups configured
[ ] Mobile tested
[ ] Accessibility tested
[ ] Performance tested
[ ] Error handling tested
[ ] SEO configured
[ ] Favicon configured
[ ] Robots configured
[ ] Sitemap configured
[ ] Production build succeeds
```

---

# 151. DEVELOPMENT AGENT BEHAVIOR

If you are an AI coding agent implementing this project, do not blindly generate the entire application in one uncontrolled operation.

Work incrementally.

Before making major architectural decisions:

1. Inspect the existing project.
2. Understand the current code.
3. Identify what already exists.
4. Preserve working functionality.
5. Avoid unnecessary rewrites.
6. Implement one coherent feature at a time.
7. Test it.
8. Then continue.

Do not destroy existing functionality merely to make the code fit your preferred architecture.

---

# 152. WHEN REQUIREMENTS ARE AMBIGUOUS

If a requirement is ambiguous, choose the simplest solution that:

- Preserves data integrity
- Preserves security
- Matches the UX philosophy
- Can be extended later

Do not introduce large systems to solve tiny uncertainties.

Document important assumptions.

---

# 153. WHEN DESIGN AND FUNCTION CONFLICT

Prioritize:

```text
Correctness
Security
Accessibility
Usability
Performance
Visual design
Decorative effects
```

A visual effect must never prevent a user from completing a financial task.

---

# 154. WHEN ANIMATION AND PERFORMANCE CONFLICT

Choose performance.

The application should remain useful on:

- older phones
- modest laptops
- slow connections

Use adaptive animation.

---

# 155. WHEN FUTURE-PROOFING AND SIMPLICITY CONFLICT

Choose a simple architecture that leaves room for growth.

Do not build hypothetical infrastructure for problems we do not have.

---

# 156. DEFINITION OF DONE

A feature is not complete simply because it renders.

A feature is complete when:

```text
UI exists
+
UX works
+
Mobile works
+
Validation works
+
Authorization works
+
Server logic works
+
Database integrity works
+
Loading state works
+
Error state works
+
Success state works
+
Accessibility works
+
Tests exist
```

For important financial functionality, also verify auditability.

---

# 157. FIRST IMPLEMENTATION TARGET

The first working vertical slice should be:

```text
Authentication
        ↓
Member/Leader role
        ↓
Dashboard
        ↓
Add financial record
        ↓
Save to database
        ↓
Update dashboard
        ↓
Activity history
```

Do not build 30 disconnected pages before this core flow works.

---

# 158. SECOND IMPLEMENTATION TARGET

Then implement:

```text
Income
Expenses
Contributions
Members
Approval workflow
```

---

# 159. THIRD IMPLEMENTATION TARGET

Then:

```text
Reports
Documents
Notifications
Audit logs
```

---

# 160. FINAL POLISH

Only after the product works should we add the premium layer:

```text
GSAP
Motion
Lottie
Three.js
Advanced charts
Ambient backgrounds
Signature transitions
Microinteractions
```

The result should feel:

> **Simple enough for anyone. Powerful enough for leaders. Beautiful enough to feel like the future.**

---

# 161. FINAL PRODUCT CHARACTER

The final application should feel like:

**A financial command center designed specifically for Grow in Jesus Choir.**

Not:

- An accounting spreadsheet
- A boring church admin system
- A generic SaaS dashboard
- A template
- A sci-fi gimmick

It should feel:

```text
CALM
        +
CLEAR
        +
TRUSTWORTHY
        +
INTELLIGENT
        +
FUTURISTIC
        +
HUMAN
```

---

# 162. FINAL ARCHITECTURAL RULE

Always preserve this separation:

```text
                 GROW IN JESUS CHOIR
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
          PUBLIC         SRC        DATABASE
             │            │            │
             │            │            │
       Static assets   App code      SQL
       SEO files       UI            Migrations
       Images          Features      Seeds
       Favicons        Services      Functions
       Lottie          Business      Triggers
                        logic        Views
```

The rule is:

> **PUBLIC contains public assets. SRC contains application code. DATABASE contains database source and SQL.**

Do not mix these responsibilities.

---

# 163. FINAL ENGINEERING PRINCIPLE

Build this project as if another team will maintain it ten years from now.

That means:

- Clear folders
- Clear names
- Clear responsibilities
- Strong types
- Good documentation
- Stable database migrations
- Centralized business logic
- Strong security
- Accessible UI
- Responsive design
- Tested financial calculations
- Minimal technical debt

At the same time, build the interface as if users are seeing the future for the first time.

That means:

- Elegant motion
- Intelligent interactions
- Beautiful data
- Spatial transitions
- Sophisticated visual hierarchy
- Premium microinteractions
- Carefully selected 3D
- Smooth feedback
- A distinctive visual identity

But remember:

> **The future should feel effortless.**

The user should never think:

> "Wow, this application is technically impressive."

They should think:

> "This is so easy. I immediately understand what is happening."

That is the ultimate success criterion.

---

# 164. EXECUTION COMMAND

Begin by inspecting the existing repository and determining:

1. Current framework
2. Current dependencies
3. Existing folder structure
4. Existing database setup
5. Existing authentication
6. Existing UI components
7. Existing environment configuration
8. Existing routes
9. Existing migrations
10. Existing assets

Do not immediately rewrite the project.

Then produce a concise implementation plan based on the existing repository.

After the plan, implement the architecture incrementally.

The first objective is a clean foundation.

The second objective is the working financial vertical slice.

The third objective is the complete product.

The fourth objective is the futuristic visual and motion layer.

The fifth objective is production hardening.

At every stage, preserve the project's architectural principles.

Never sacrifice financial correctness, security, accessibility, usability, or performance for visual effects.

The final result must be a **production-quality Grow in Jesus Choir financial monitoring platform** that is easy enough for a non-technical member, powerful enough for a choir leader, maintainable for future developers, and visually sophisticated enough to represent a truly modern digital product.

**Build deliberately. Build cleanly. Build accessibly. Build beautifully. Build for the long term.**