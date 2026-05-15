export type RefreshOperation = () => Promise<void>

export function createAuthRefreshCoordinator(refresh: RefreshOperation): RefreshOperation {
  let refreshPromise: Promise<void> | null = null

  return async () => {
    if (!refreshPromise) {
      refreshPromise = refresh().finally(() => {
        refreshPromise = null
      })
    }

    return refreshPromise
  }
}
