import { useEffect } from 'react'
import { useAuthStore } from './auth-store'
import { restoreSession } from './session-actions'

/**
 * 앱 최초 마운트 시 1회 세션 복구를 시도하는 훅.
 *
 * accessToken 은 메모리에만 있어 새로고침하면 사라지지만, refreshToken 쿠키로
 * /auth/refresh 를 호출해 재발급받아 로그인 상태(및 role)를 복구한다.
 * 쿠키가 없거나 만료면 실패하고 비로그인으로 시작한다.
 */
export const useAuthBootstrap = () => {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)

  useEffect(() => {
    let cancelled = false
    restoreSession()
      .catch(() => {
        // 복구 실패 = 비로그인. 조용히 넘어간다.
      })
      .finally(() => {
        if (!cancelled) useAuthStore.getState().setBootstrapped()
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { isBootstrapping }
}
