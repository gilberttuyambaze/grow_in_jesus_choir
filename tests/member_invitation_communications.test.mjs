import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canManageMemberCommunication,
  deduplicateRecipients,
  isInvitationAcceptable,
  isValidEmail,
  normalizeEmail,
  INVITATION_TOKEN_PATTERN,
  countRecipientRateLimit
} from '../src/features/communications/domain.mjs'
import {
  escapeHtml,
  renderCommunicationEmail,
  renderInvitationEmail
} from '../src/lib/email/brand-templates.mjs'

test('only leaders and admins may manage member communications', () => {
  assert.equal(canManageMemberCommunication('LEADER'), true)
  assert.equal(canManageMemberCommunication('ADMIN'), true)
  assert.equal(canManageMemberCommunication('MEMBER'), false)
  assert.equal(canManageMemberCommunication('AUDITOR'), false)
})

test('manual addresses are normalized and validated', () => {
  assert.equal(normalizeEmail('  Choir.Member@Example.org '), 'choir.member@example.org')
  assert.equal(isValidEmail('choir.member@example.org'), true)
  assert.equal(isValidEmail('not-an-email'), false)
  assert.equal(isValidEmail('x'.repeat(250) + '@example.org'), false)
})

test('member recipients are deduplicated by case-insensitive email and invalid addresses are excluded', () => {
  const result = deduplicateRecipients([
    { id: 'm1', email: 'member@example.org' },
    { id: 'm2', email: 'MEMBER@example.org' },
    { id: 'm3', email: 'bad-address' },
    { id: 'm4', email: 'other@example.org' }
  ])
  assert.deepEqual(result.map((item) => item.id), ['m1', 'm4'])
})

test('invitation tokens require an unpredictable base64url-sized token and valid state', () => {
  assert.equal(INVITATION_TOKEN_PATTERN.test('A'.repeat(43)), true)
  assert.equal(INVITATION_TOKEN_PATTERN.test('member-id'), false)
  const future = new Date(Date.now() + 60_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()
  assert.equal(isInvitationAcceptable('PENDING', future), true)
  assert.equal(isInvitationAcceptable('SENT', future), true)
  assert.equal(isInvitationAcceptable('FAILED', future), true)
  assert.equal(isInvitationAcceptable('ACCEPTED', future), false)
  assert.equal(isInvitationAcceptable('CANCELLED', future), false)
  assert.equal(isInvitationAcceptable('EXPIRED', future), false)
  assert.equal(isInvitationAcceptable('SENT', past), false)
})

test('communication rate limits stop excessive sends and mass sends', () => {
  assert.deepEqual(countRecipientRateLimit({ countInLastHour: 19, massCountInLastHour: 2 }), { allowed: true, reason: null })
  assert.deepEqual(countRecipientRateLimit({ countInLastHour: 20, massCountInLastHour: 0 }), { allowed: false, reason: 'hourly_limit' })
  assert.deepEqual(countRecipientRateLimit({ countInLastHour: 2, massCountInLastHour: 3 }), { allowed: false, reason: 'mass_send_limit' })
})

test('email body, names, subject, and URLs are encoded in the branded templates', () => {
  assert.equal(escapeHtml(`<script a="x">'&`), '&lt;script a=&quot;x&quot;&gt;&#39;&amp;')
  const communication = renderCommunicationEmail({
    subject: '<img src=x onerror=alert(1)>', body: '<script>alert(1)</script>',
    senderName: 'Leader <admin>', important: true
  })
  assert.equal(communication.includes('<script>alert(1)</script>'), false)
  assert.equal(communication.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true)
  assert.equal(communication.includes('&lt;img src=x onerror=alert(1)&gt;'), true)
  const invitation = renderInvitationEmail({
    fullName: '<svg onload=alert(1)>', inviterName: 'Leader', message: '<b>Welcome</b>',
    acceptUrl: 'https://choir.example/invite/abc?x="<script>', expiresAt: '12 Oct 2026, 5:00 pm'
  })
  assert.equal(invitation.includes('<svg onload=alert(1)>'), false)
  assert.equal(invitation.includes('&lt;b&gt;Welcome&lt;/b&gt;'), true)
  assert.equal(invitation.includes('&lt;script&gt;'), true)
})
