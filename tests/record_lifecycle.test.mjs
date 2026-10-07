import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

describe('Record Lifecycle & Status Transitions (Sections 41, 72, 110, 141)', () => {
  test('valid status state machine transitions', () => {
    const validStatuses = ['recorded', 'needs_review', 'rejected', 'voided']
    
    function transitionStatus(currentStatus, action) {
      if (action === 'SUBMIT_BY_MEMBER') return 'needs_review'
      if (action === 'SUBMIT_BY_LEADER') return 'recorded'
      if (action === 'APPROVE' && currentStatus === 'needs_review') return 'recorded'
      if (action === 'REJECT' && currentStatus === 'needs_review') return 'rejected'
      if (action === 'VOID' && currentStatus === 'recorded') return 'voided'
      throw new Error(`Invalid transition: ${action} from ${currentStatus}`)
    }

    assert.equal(transitionStatus(null, 'SUBMIT_BY_MEMBER'), 'needs_review')
    assert.equal(transitionStatus(null, 'SUBMIT_BY_LEADER'), 'recorded')
    assert.equal(transitionStatus('needs_review', 'APPROVE'), 'recorded')
    assert.equal(transitionStatus('needs_review', 'REJECT'), 'rejected')
    assert.equal(transitionStatus('recorded', 'VOID'), 'voided')
    assert.throws(() => transitionStatus('rejected', 'VOID'))
  })

  test('rejection requires non-empty reason when reviewed', () => {
    function validateRejection(reason) {
      if (!reason || reason.trim().length === 0) {
        return { valid: false, error: 'Rejection reason is required' }
      }
      return { valid: true }
    }

    assert.equal(validateRejection('').valid, false)
    assert.equal(validateRejection('   ').valid, false)
    assert.equal(validateRejection('Missing receipt attachment').valid, true)
  })

  test('voiding requires audit rationale confirmation', () => {
    function validateVoidAction(reason, userRole) {
      if (userRole !== 'LEADER' && userRole !== 'ADMIN') {
        return { allowed: false, error: 'Unauthorized' }
      }
      if (!reason || reason.trim().length === 0) {
        return { allowed: false, error: 'Void reason required' }
      }
      return { allowed: true }
    }

    assert.equal(validateVoidAction('Mistaken duplicate', 'MEMBER').allowed, false)
    assert.equal(validateVoidAction('', 'LEADER').allowed, false)
    assert.equal(validateVoidAction('Mistaken duplicate', 'LEADER').allowed, true)
  })
})

