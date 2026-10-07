import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const connectionString =
  process.env.POSTGRES_DATABASE_URL ||
  process.env.POSTGRES_DIRECT_URL ||
  process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Set POSTGRES_DATABASE_URL (or POSTGRES_DIRECT_URL) before applying PostgreSQL migrations.')
}

const caCertPath = process.env.POSTGRES_CA_CERT_PATH?.trim()
const caCert = caCertPath ? fs.readFileSync(path.resolve(process.cwd(), caCertPath), 'utf8') : undefined

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: true, ...(caCert ? { ca: caCert } : {}) },
  max: 2,
  connectionTimeoutMillis: 10000
})

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
  const migrationFiles = fs.readdirSync(migrationsDir).filter((name) => /^\d+_[\w-]+\.sql$/.test(name)).sort()

  for (const name of migrationFiles) {
    const applied = await pool.query('SELECT 1 FROM app_schema_migrations WHERE name = $1', [name])
    if (applied.rowCount) {
      console.log(`Skipping applied migration ${name}`)
      continue
    }

    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO app_schema_migrations (name) VALUES ($1)', [name])
      await client.query('COMMIT')
      console.log(`Applied ${name}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
} finally {
  await pool.end()
}
