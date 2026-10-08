import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getRuntimePostgresConnectionUrl } from '../src/lib/db/connection-url.mjs'

test('Supabase session pooler URLs use transaction pooling for runtime', () => {
  const result = getRuntimePostgresConnectionUrl(
    'postgresql://postgres.project-ref:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
  )
  assert.equal(
    result.connectionString,
    'postgresql://postgres.project-ref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require'
  )
  assert.equal(result.switchedToTransactionPooler, true)
})

test('existing transaction pooler and direct database URLs are left unchanged', () => {
  const transactionPooler = 'postgresql://postgres.project-ref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  const directDatabase = 'postgresql://postgres:secret@db.project-ref.supabase.co:5432/postgres'
  assert.deepEqual(getRuntimePostgresConnectionUrl(transactionPooler), {
    connectionString: transactionPooler,
    switchedToTransactionPooler: false
  })
  assert.deepEqual(getRuntimePostgresConnectionUrl(directDatabase), {
    connectionString: directDatabase,
    switchedToTransactionPooler: false
  })
})
