export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safeHttpUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Email links must use an absolute HTTP or HTTPS URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Email links must use an absolute HTTP or HTTPS URL.')
  }
  return url.href
}

function siteLinks(baseUrl) {
  const origin = new URL(safeHttpUrl(baseUrl)).origin
  return {
    home: safeHttpUrl(new URL('/', origin).href),
    workspace: safeHttpUrl(new URL('/login', origin).href),
    logo: safeHttpUrl(new URL('/images/brand/grow-in-jesus-choir-logo-static.png', origin).href)
  }
}

function plainTextToHtml(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

function messageToHtml(value) {
  return String(value).trim().split(/\r?\n\s*\r?\n/).filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#454a62">${plainTextToHtml(paragraph.trim())}</p>`)
    .join('')
}

const themes = {
  invitation: {
    accent: '#16a8c7',
    soft: '#edfaff',
    border: '#bceaf4',
    label: 'MEMBER INVITATION',
    eyebrow: '#167c99'
  },
  standard: {
    accent: '#6254c7',
    soft: '#f3f2ff',
    border: '#d9d5ff',
    label: 'CHOIR UPDATE',
    eyebrow: '#6254c7'
  },
  important: {
    accent: '#c47a16',
    soft: '#fff7e9',
    border: '#f1d29b',
    label: 'IMPORTANT ANNOUNCEMENT',
    eyebrow: '#9a5c08'
  }
}

function emailLayout({ baseUrl, preheader, title, content, theme, ctaLabel, ctaUrl, footerNote = '' }) {
  const links = siteLinks(baseUrl)
  const action = ctaLabel && ctaUrl
    ? `<tr><td align="left" style="padding:24px 0 4px"><a href="${escapeHtml(safeHttpUrl(ctaUrl))}" style="display:inline-block;padding:14px 24px;border-radius:10px;background-color:${theme.accent};color:#ffffff;text-decoration:none;font-size:15px;line-height:1.2;font-weight:700">${escapeHtml(ctaLabel)}</a></td></tr>`
    : ''

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f2f4fb;font-family:Arial,Helvetica,sans-serif;color:#20213d">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f4fb;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;border:1px solid #e0e4f0;border-radius:18px;background-color:#ffffff;overflow:hidden">
        <tr><td style="height:5px;background-color:${theme.accent};font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td style="padding:22px 28px;background-color:#26234f">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="58" valign="middle"><a href="${escapeHtml(links.home)}" style="text-decoration:none"><img src="${escapeHtml(links.logo)}" width="48" height="48" alt="Grow in Jesus Choir" style="display:block;width:48px;height:48px;border:0;border-radius:12px;background-color:#ffffff"></a></td>
            <td valign="middle" style="padding-left:13px"><div style="font-size:15px;line-height:1.4;font-weight:700;letter-spacing:.04em;color:#ffffff">GROW IN JESUS CHOIR</div><div style="padding-top:4px;font-size:12px;line-height:1.4;color:#c8c9e9">Faith • Fellowship • Harmony</div></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px 10px">
          <div style="display:inline-block;padding:6px 10px;border:1px solid ${theme.border};border-radius:999px;background-color:${theme.soft};font-size:10px;line-height:1.2;font-weight:700;letter-spacing:.1em;color:${theme.eyebrow}">${theme.label}</div>
          <h1 style="margin:16px 0 20px;font-size:26px;line-height:1.25;color:#20213d">${escapeHtml(title)}</h1>
          ${content}
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">${action}</table>
          ${footerNote ? `<p style="margin:20px 0 4px;font-size:12px;line-height:1.7;color:#70758b">${footerNote}</p>` : ''}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e7e9f2;background-color:#fafbff">
          <p style="margin:0 0 10px;font-size:12px;line-height:1.7;color:#62677d">Sent with care by <strong style="color:#303250">Grow in Jesus Choir, Rwanda</strong>. For assistance, please contact your choir administrator.</p>
          <p style="margin:0;font-size:12px;line-height:1.8;color:#62677d"><a href="${escapeHtml(links.home)}" style="color:#5146ad;text-decoration:underline">Visit our website</a><span style="color:#a5a8b8"> &nbsp;·&nbsp; </span><a href="${escapeHtml(links.workspace)}" style="color:#5146ad;text-decoration:underline">Open the choir workspace</a></p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:11px;line-height:1.6;color:#85899b">You received this email because of your connection with Grow in Jesus Choir.</p>
    </td></tr>
  </table>
</body></html>`
}

export function renderInvitationEmail({ baseUrl, fullName, inviterName, message, acceptUrl, expiresAt }) {
  const note = message?.trim()
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0"><tr><td style="padding:15px 17px;border-left:4px solid #16a8c7;border-radius:8px;background-color:#edfaff;font-size:14px;line-height:1.75;color:#343653">${plainTextToHtml(message.trim())}</td></tr></table>`
    : ''
  const body = `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#454a62">Hello ${escapeHtml(fullName)},</p><p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#454a62"><strong style="color:#26234f">${escapeHtml(inviterName)}</strong> has invited you to join Grow in Jesus Choir. We are delighted to welcome you into our community of faith, fellowship, and music.</p>${note}<p style="margin:0 0 4px;font-size:15px;line-height:1.75;color:#454a62">Accept your invitation to set a secure password and activate your choir account. Your workspace will help you stay connected with choir updates and member resources.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;border:1px solid #bceaf4;border-radius:10px;background-color:#edfaff"><tr><td style="padding:15px 17px;font-size:13px;line-height:1.7;color:#3f5660"><strong style="color:#20213d">Invitation details</strong><br>Expires: ${escapeHtml(expiresAt)}<br>This secure link can be used once and will no longer work after acceptance, cancellation, or expiry.</td></tr></table>`
  return emailLayout({
    baseUrl,
    preheader: 'You have been invited to join Grow in Jesus Choir. Accept your invitation to activate your member account.',
    title: 'You’re invited to join',
    content: body,
    theme: themes.invitation,
    ctaLabel: 'Accept your invitation',
    ctaUrl: acceptUrl,
    footerNote: 'If you were not expecting this invitation, you can safely ignore this email.'
  })
}

export function renderCommunicationEmail({ baseUrl, subject, body, senderName, important }) {
  const theme = important ? themes.important : themes.standard
  const content = `${important ? '<p style="margin:0 0 18px;padding:12px 14px;border:1px solid #f1d29b;border-radius:9px;background-color:#fff7e9;font-size:13px;line-height:1.6;font-weight:700;color:#805100">Please take note: this is an important message from choir leadership.</p>' : ''}${messageToHtml(body)}<p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#62677d">With care,<br><strong style="color:#252646">${escapeHtml(senderName)}</strong><br>Grow in Jesus Choir leadership</p>`
  return emailLayout({
    baseUrl,
    preheader: subject,
    title: subject,
    content,
    theme,
    ctaLabel: 'Open the choir workspace',
    ctaUrl: new URL('/login', new URL(safeHttpUrl(baseUrl)).origin).href,
    footerNote: 'This message was addressed to you individually. Other recipients’ email addresses are not shared.'
  })
}
