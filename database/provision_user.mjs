import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import pg from 'pg'

const scrypt = promisify(crypto.scrypt)
const voiceParts = new Set(['Soprano', 'Alto', 'Tenor', 'Bass'])
const roles = new Set(['MEMBER', 'LEADER', 'ADMIN', 'AUDITOR'])

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const value = line.trim()
    if (!value || value.startsWith('#')) continue
    const separator = value.indexOf('=')
    if (separator < 1) continue
    const name = value.slice(0, separator).trim()
    let setting = value.slice(separator + 1).trim()
    if ((setting.startsWith('"') && setting.endsWith('"')) || (setting.startsWith("'") && setting.endsWith("'"))) {
      setting = setting.slice(1, -1)
    }
    if (!process.env[name]) process.env[name] = setting
  }
}

function parseOptions(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--') continue
    if (arg === '--help') return { help: true }
    if (!['--email', '--name', '--role', '--voice-part'].includes(arg)) {
      throw new Error(`Unknown option: ${arg}`)
    }
    options[arg.slice(2)] = args[index + 1]
    index += 1
  }
  return options
}

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Password provisioning requires an interactive terminal.')
  }

  process.stdout.write(prompt)
  return new Promise((resolve, reject) => {
    let value = ''
    const wasRaw = process.stdin.isRaw
    const onData = (chunk) => {
      const input = chunk.toString('utf8')
      if (input === '\u0003') {
        cleanup()
        process.stdout.write('\n')
        reject(new Error('Cancelled.'))
        return
      }
      if (input === '\r' || input === '\n') {
        cleanup()
        process.stdout.write('\n')
        resolve(value)
        return
      }
      if (input === '\u007f' || input === '\b') {
        value = value.slice(0, -1)
        return
      }
      if (!input.startsWith('\u001b') && input >= ' ') value += input
    }
    const cleanup = () => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(Boolean(wasRaw))
    }
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', onData)
  })
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  })
  return `scrypt$32768$8$1$${salt.toString('hex')}$${Buffer.from(key).toString('hex')}`
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

loadEnv()
const options = parseOptions(process.argv.slice(2))
if (options.help) {
  console.log('Usage: pnpm auth:provision -- --email user@example.org --name "Full Name" --role MEMBER|LEADER|ADMIN|AUDITOR [--voice-part Soprano|Alto|Tenor|Bass]')
  process.exit(0)
}

const email = String(options.email || '').trim().toLowerCase()
const fullName = String(options.name || '').trim()
const roleName = String(options.role || '').trim().toUpperCase()
const voicePart = String(options['voice-part'] || '').trim()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Provide a valid --email.')
if (!fullName || fullName.length > 120) throw new Error('Provide a --name with at most 120 characters.')
if (!roles.has(roleName)) throw new Error('Choose a supported --role.')
if (roleName === 'MEMBER' && voicePart && !voiceParts.has(voicePart)) throw new Error('Choose a valid --voice-part.')

const password = await readSecret('New password (hidden): ')
const confirmation = await readSecret('Confirm password (hidden): ')
if (password !== confirmation) throw new Error('Passwords do not match.')
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
  throw new Error('Password must contain at least 12 characters and be at most 1024 bytes.')
}

const connectionString = process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_DIRECT_URL || process.env.DATABASE_URL
if (!connectionString || !/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error('Set POSTGRES_DATABASE_URL to a PostgreSQL connection URI.')
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: 1,
  connectionTimeoutMillis: 10000
})

const client = await pool.connect()
try {
  await client.query('BEGIN')
  const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [roleName])
  if (!roleResult.rows[0]) throw new Error('Role definitions are missing. Run pnpm db:migrate first.')

  const existingResult = await client.query('SELECT id FROM users WHERE LOWER(email) = $1 FOR UPDATE', [email])
  const existing = existingResult.rows[0]
  const userId = existing?.id || crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const avatarInitials = initials(fullName)

  if (existing) {
    await client.query(
      `UPDATE users
       SET email = $2, password_hash = $3, role_id = $4, full_name = $5,
           avatar_initials = $6, is_active = TRUE, password_changed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId, email, passwordHash, roleResult.rows[0].id, fullName, avatarInitials]
    )
  } else {
    await client.query(
      `INSERT INTO users (id, email, password_hash, role_id, full_name, avatar_initials, is_active, password_changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())`,
      [userId, email, passwordHash, roleResult.rows[0].id, fullName, avatarInitials]
    )
  }

  if (roleName === 'MEMBER') {
    const memberResult = await client.query('SELECT id FROM members WHERE user_id = $1 FOR UPDATE', [userId])
    if (memberResult.rows[0]) {
      await client.query('UPDATE members SET full_name = $2, updated_at = NOW() WHERE user_id = $1', [userId, fullName])
    } else {
      if (!voicePart) throw new Error('New MEMBER accounts need --voice-part.')
      await client.query(
        `INSERT INTO members (id, user_id, full_name, voice_part)
         VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), userId, fullName, voicePart]
      )
    }
  }

  await client.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId])
  await client.query('DELETE FROM auth_login_attempts WHERE email = LOWER($1)', [email])
  await client.query('COMMIT')
  console.log(`${existing ? 'Updated' : 'Created'} ${roleName} account ${email}. Existing sessions were revoked.`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
