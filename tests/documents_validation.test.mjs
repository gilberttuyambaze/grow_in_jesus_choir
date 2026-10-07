import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function validateDocumentUpload(mimeType, sizeBytes) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Invalid file format. Only JPEG, PNG, WEBP, and PDF files are permitted.' }
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds the maximum permitted size of 5 MB.' }
  }
  return { valid: true }
}

describe('Document Upload Security & Validation (Section 42)', () => {
  test('permits valid PDF and image files within 5MB', () => {
    assert.deepEqual(validateDocumentUpload('application/pdf', 1024 * 1024), { valid: true })
    assert.deepEqual(validateDocumentUpload('image/jpeg', 2 * 1024 * 1024), { valid: true })
    assert.deepEqual(validateDocumentUpload('image/png', 500 * 1024), { valid: true })
  })

  test('rejects arbitrary executable or disallowed file types', () => {
    assert.equal(validateDocumentUpload('application/x-sh', 1024).valid, false)
    assert.equal(validateDocumentUpload('application/javascript', 1024).valid, false)
    assert.equal(validateDocumentUpload('text/html', 1024).valid, false)
  })

  test('strictly enforces 5MB size limit', () => {
    assert.equal(validateDocumentUpload('application/pdf', 5 * 1024 * 1024 + 1).valid, false)
    assert.equal(validateDocumentUpload('application/pdf', 5 * 1024 * 1024).valid, true)
  })
})

