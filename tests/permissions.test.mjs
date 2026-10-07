import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

function canViewAllFinances(role) {
  return role === 'LEADER' || role === 'ADMIN' || role === 'AUDITOR'
}

function canCreateRecord(role) {
  return role === 'LEADER' || role === 'MEMBER' || role === 'ADMIN'
}

function canCreateExpense(role) {
  return role === 'LEADER' || role === 'ADMIN'
}

function canApproveRecord(role) {
  return role === 'LEADER' || role === 'ADMIN'
}

function canManageMembers(role) {
  return role === 'LEADER' || role === 'ADMIN'
}

function canViewMemberRecord(actorRole, actorUserId, targetMemberUserId) {
  if (canViewAllFinances(actorRole)) return true
  return Boolean(targetMemberUserId && actorUserId === targetMemberUserId)
}

describe('Centralized Role-Based Access Control (RBAC) (Section 39)', () => {
  test('leaders have access to view all finances, approve records, and manage members', () => {
    assert.equal(canViewAllFinances('LEADER'), true)
    assert.equal(canCreateExpense('LEADER'), true)
    assert.equal(canApproveRecord('LEADER'), true)
    assert.equal(canManageMembers('LEADER'), true)
  })

  test('members cannot view organizational finances or approve records', () => {
    assert.equal(canViewAllFinances('MEMBER'), false)
    assert.equal(canCreateExpense('MEMBER'), false)
    assert.equal(canApproveRecord('MEMBER'), false)
    assert.equal(canManageMembers('MEMBER'), false)
  })

  test('members are permitted to create their own contribution records', () => {
    assert.equal(canCreateRecord('MEMBER'), true)
  })

  test('members can only inspect their own personal contribution records', () => {
    assert.equal(canViewMemberRecord('MEMBER', 'user_john', 'user_john'), true)
    assert.equal(canViewMemberRecord('MEMBER', 'user_john', 'user_grace'), false)
    assert.equal(canViewMemberRecord('LEADER', 'user_sarah', 'user_grace'), true)
  })
})
