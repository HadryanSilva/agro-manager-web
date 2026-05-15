import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthRefreshCoordinator } from '../authRefreshCoordinator.ts'

test('shares one refresh operation across concurrent callers', async () => {
  let calls = 0
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })

  const refreshOnce = createAuthRefreshCoordinator(async () => {
    calls += 1
    await pending
  })

  const first = refreshOnce()
  const second = refreshOnce()
  release()

  await Promise.all([first, second])

  assert.equal(calls, 1)
})

test('starts a new refresh after the previous operation settles', async () => {
  let calls = 0
  const refreshOnce = createAuthRefreshCoordinator(async () => {
    calls += 1
  })

  await refreshOnce()
  await refreshOnce()

  assert.equal(calls, 2)
})
