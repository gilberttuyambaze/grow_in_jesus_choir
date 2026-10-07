import assert from 'node:assert/strict'
import { test } from 'node:test'
import { localDateTimeToIso, sessionDateIso } from '../src/lib/utils/zoned-time.ts'

test('session form times are stored as UTC instants from Kigali local time', () => {
  const instant = localDateTimeToIso('2026-10-12T17:00')
  assert.equal(instant, '2026-10-12T15:00:00.000Z')
  assert.equal(sessionDateIso(instant), '2026-10-12')
})

test('session form rejects impossible local calendar dates', () => {
  assert.equal(localDateTimeToIso('2026-02-31T10:00'), null)
})
