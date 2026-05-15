import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ResponseNormalizationError,
  normalizeListPayload,
  normalizeObjectPayload,
  normalizePagePayload,
} from '../responseUtils.ts'

test('normalizeListPayload rejects unexpected payloads instead of hiding API contract breaks', () => {
  assert.throws(
    () => normalizeListPayload({ total: 3 }),
    ResponseNormalizationError
  )
})

test('normalizeObjectPayload rejects missing object payloads instead of returning an empty object', () => {
  assert.throws(
    () => normalizeObjectPayload(null),
    ResponseNormalizationError
  )
})

test('normalizePagePayload rejects page payloads without a list field', () => {
  assert.throws(
    () => normalizePagePayload({ page: 0, totalElements: 2 }),
    ResponseNormalizationError
  )
})
