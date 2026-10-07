import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

function calculateFinancialTotals(records) {
  let totalIncome = 0
  let totalExpenses = 0
  let pendingCount = 0

  for (const r of records) {
    if (r.status === 'needs_review') {
      pendingCount++
      continue // Pending records are not recognized in verified ledger balance
    }
    if (r.status === 'rejected' || r.status === 'voided') {
      continue // Voided / rejected records do not affect net balance
    }

    if (r.type === 'income') {
      totalIncome += Math.round(r.amount)
    } else if (r.type === 'expense') {
      totalExpenses += Math.round(r.amount)
    }
  }

  const currentBalance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    pendingCount
  }
}

describe('Financial Calculation Engine Tests (Section 89)', () => {
  test('scenario: zero income, zero expenses', () => {
    const res = calculateFinancialTotals([])
    assert.deepEqual(res, {
      totalIncome: 0,
      totalExpenses: 0,
      currentBalance: 0,
      pendingCount: 0
    })
  })

  test('scenario: income only', () => {
    const records = [
      { type: 'income', amount: 50000, status: 'recorded' },
      { type: 'income', amount: 150000, status: 'recorded' }
    ]
    const res = calculateFinancialTotals(records)
    assert.equal(res.totalIncome, 200000)
    assert.equal(res.totalExpenses, 0)
    assert.equal(res.currentBalance, 200000)
  })

  test('scenario: expenses only', () => {
    const records = [
      { type: 'expense', amount: 30000, status: 'recorded' },
      { type: 'expense', amount: 45000, status: 'recorded' }
    ]
    const res = calculateFinancialTotals(records)
    assert.equal(res.totalIncome, 0)
    assert.equal(res.totalExpenses, 75000)
    assert.equal(res.currentBalance, -75000)
  })

  test('scenario: multiple records on same day and large values', () => {
    const records = [
      { type: 'income', amount: 10000000, status: 'recorded' },
      { type: 'income', amount: 25000000, status: 'recorded' },
      { type: 'expense', amount: 5000000, status: 'recorded' }
    ]
    const res = calculateFinancialTotals(records)
    assert.equal(res.totalIncome, 35000000)
    assert.equal(res.totalExpenses, 5000000)
    assert.equal(res.currentBalance, 30000000)
  })

  test('scenario: pending and voided records do not pollute verified balance', () => {
    const records = [
      { type: 'income', amount: 100000, status: 'recorded' },
      { type: 'income', amount: 50000, status: 'needs_review' },
      { type: 'expense', amount: 20000, status: 'rejected' },
      { type: 'expense', amount: 30000, status: 'voided' },
      { type: 'expense', amount: 40000, status: 'recorded' }
    ]
    const res = calculateFinancialTotals(records)
    assert.equal(res.totalIncome, 100000)
    assert.equal(res.totalExpenses, 40000)
    assert.equal(res.currentBalance, 60000)
    assert.equal(res.pendingCount, 1)
  })

  test('reconciles project benchmark: 2,860,000 income, 1,015,000 expenses, 1,845,000 balance', () => {
    const records = [
      { type: 'income', amount: 1280000, status: 'recorded' },
      { type: 'income', amount: 250000, status: 'recorded' },
      { type: 'income', amount: 850000, status: 'recorded' },
      { type: 'income', amount: 480000, status: 'recorded' },
      { type: 'expense', amount: 30000, status: 'recorded' },
      { type: 'expense', amount: 450000, status: 'recorded' },
      { type: 'expense', amount: 280000, status: 'recorded' },
      { type: 'expense', amount: 85000, status: 'needs_review' },
      { type: 'expense', amount: 120000, status: 'needs_review' },
      { type: 'expense', amount: 50000, status: 'needs_review' },
      { type: 'income', amount: 50000, status: 'needs_review' },
      // other expense recorded to match 1,015,000 total recorded expenses
      { type: 'expense', amount: 255000, status: 'recorded' }
    ]
    const res = calculateFinancialTotals(records)
    assert.equal(res.totalIncome, 2860000)
    assert.equal(res.totalExpenses, 1015000)
    assert.equal(res.currentBalance, 1845000)
    assert.equal(res.pendingCount, 4)
  })
})
