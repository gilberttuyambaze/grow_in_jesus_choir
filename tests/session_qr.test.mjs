import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { test } from 'node:test'
import { encodeAttendanceQr } from '../src/features/sessions/qr.ts'

const referenceUrl = 'http://localhost:3000/s/123e4567-e89b-12d3-a456-426614174000/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

test('attendance QR uses a standards-compatible version 10-L matrix', () => {
  const matrix = encodeAttendanceQr(referenceUrl)
  assert.equal(matrix.length, 57)
  assert.equal(matrix.every((row) => row.length === 57), true)
  const digest = crypto.createHash('sha256').update(matrix.flat().map((bit) => bit ? '1' : '0').join('')).digest('hex')
  assert.equal(digest, '83efca4116909c002cf29bc5667b34406b6952967948b28ca390df6257bf0d3e')
})

test('attendance QR rejects payloads larger than the supported byte capacity', () => {
  assert.throws(() => encodeAttendanceQr('x'.repeat(272)), /too long/)
})
