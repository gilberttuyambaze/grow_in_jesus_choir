/**
 * Database Migration & Seeder CLI
 * Executes migrations sequentially and applies seed data
 */
const { DatabaseSync } = require('node:sqlite')
const fs = require('node:fs')
const path = require('node:path')

const dbDir = path.resolve(__dirname, '../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = process.env.DATABASE_URL ? path.resolve(process.env.DATABASE_URL) : path.join(dbDir, 'choir_finance.db')
console.log(`[DB] Initializing database at: ${dbPath}`)

const db = new DatabaseSync(dbPath)

// Enable foreign keys and WAL mode for reliability and concurrency
db.exec('PRAGMA foreign_keys = ON;')
db.exec('PRAGMA journal_mode = WAL;')

// 1. Run migrations
const migrationsDir = path.join(__dirname, 'migrations')
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

for (const file of migrationFiles) {
  console.log(`[DB] Applying migration: ${file}`)
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
  db.exec(sql)
}

// 2. Run seeds
const seedsDir = path.join(__dirname, 'seeds')
if (fs.existsSync(seedsDir)) {
  const seedFiles = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of seedFiles) {
    console.log(`[DB] Applying seed: ${file}`)
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8')
    db.exec(sql)
  }
}

console.log('[DB] Database migrations and seeds applied successfully.')
db.close()

