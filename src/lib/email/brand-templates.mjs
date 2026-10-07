export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function plainTextToHtml(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

function emailLayout({ preheader, title, content, ctaLabel, ctaUrl, footerNote = '' }) {
  const action = ctaLabel && ctaUrl
    ? `<tr><td style="padding:24px 0 8px"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:13px 22px;border-radius:12px;background-color:#5b21b6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">${escapeHtml(ctaLabel)}</a></td></tr>`
    : ''
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#eef1fb;font-family:Arial,Helvetica,sans-serif;color:#171833">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef1fb;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;border:1px solid #dce1f2;border-radius:20px;background-color:#ffffff;overflow:hidden">
        <tr><td style="padding:22px 28px;background-color:#26234f;border-bottom:4px solid #21c6e8">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="54" valign="middle"><img src="${escapeHtml(getLogoUrl())}" width="44" height="44" alt="Grow in Jesus Choir logo" style="display:block;width:44px;height:44px;border:0;border-radius:12px;background-color:#ffffff"></td>
            <td valign="middle" style="padding-left:12px"><div style="font-size:15px;font-weight:700;letter-spacing:.04em;color:#ffffff">GROW IN JESUS CHOIR</div><div style="padding-top:4px;font-size:11px;color:#c8c9e9">Member workspace</div></td>
            <td align="right" valign="middle" style="font-size:24px;letter-spacing:8px;color:#8eeeff">◇ ◇</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px 28px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b55c8">Choir communication</div>
          <h1 style="margin:10px 0 18px;font-size:25px;line-height:1.25;color:#171833">${escapeHtml(title)}</h1>
          ${content}
          ${action}
          ${footerNote ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#70758b">${footerNote}</p>` : ''}
        </td></tr>
        <tr><td style="padding:17px 28px;border-top:1px solid #e7e9f2;background-color:#fafbff;font-size:11px;line-height:1.7;color:#74788c">Grow in Jesus Choir · Rwanda<br>This message was sent by choir leadership. If you need help, contact your choir administrator.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function getLogoUrl() {
  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  return `${base}/images/brand/grow-in-jesus-choir-logo-static.png`
}

export function renderInvitationEmail({ fullName, inviterName, message, acceptUrl, expiresAt }) {
  const note = message?.trim()
    ? `<div style="margin:18px 0;padding:15px 16px;border-left:3px solid #21bde4;border-radius:8px;background-color:#f4f6ff;font-size:14px;line-height:1.7;color:#343653">${plainTextToHtml(message.trim())}</div>`
    : ''
  const body = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4f536a">Hello ${escapeHtml(fullName)}, ${escapeHtml(inviterName)} invited you to join Grow in Jesus Choir as a member.</p>${note}<p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#4f536a">Use the secure link below to choose your password and activate your choir account.</p><p style="margin:18px 0 0;padding:13px 15px;border:1px solid #e2e5f1;border-radius:10px;background-color:#fafbff;font-size:13px;line-height:1.7;color:#565a70"><strong>Invitation expires:</strong> ${escapeHtml(expiresAt)}<br>This link can be used once and is invalid after acceptance or cancellation.</p>`
  return emailLayout({
    preheader: 'You have been invited to join Grow in Jesus Choir.',
    title: 'You’re invited to join',
    content: body,
    ctaLabel: 'Accept invitation',
    ctaUrl: acceptUrl,
    footerNote: 'If you were not expecting this invitation, you can ignore this email.'
  })
}

export function renderCommunicationEmail({ subject, body, senderName, important }) {
  const importance = important
    ? '<div style="margin:0 0 16px;padding:10px 12px;border-radius:9px;background-color:#fff7e7;color:#805100;font-size:12px;font-weight:700">Important message from choir leadership</div>'
    : ''
  const content = `${importance}<p style="margin:0;font-size:14px;line-height:1.8;color:#454a62">${plainTextToHtml(body)}</p><p style="margin:23px 0 0;font-size:13px;color:#62677d">With care,<br><strong style="color:#252646">${escapeHtml(senderName)}</strong><br>Grow in Jesus Choir leadership</p>`
  return emailLayout({
    preheader: subject,
    title: subject,
    content,
    footerNote: 'This message was addressed to you individually. Other recipients’ email addresses are not shared.'
  })
}

