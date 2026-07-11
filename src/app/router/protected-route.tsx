import { Navigate, Outlet } from 'react-router-dom'
import { useAuthBootstrap, useAuthStore, UserRole } from '../../entities/session'
import { ROUTES } from '../../shared/config'

/**
 * 보호 라우트 게이트. CmsLayout(모든 관리자 페이지) 위를 감싼다.
 *
 * 1) 마운트 시 세션 복구(refresh) 시도 → 끝날 때까지 로딩
 * 2) 토큰 없으면 → 로그인
 * 3) 토큰 있으나 role !== ADMIN → 권한없음
 * 4) ADMIN → 하위 페이지 렌더
 */
export function ProtectedRoute() {
  const { isBootstrapping } = useAuthBootstrap()
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)

  if (isBootstrapping) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <p className="text-muted">세션 확인 중…</p>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (role !== UserRole.ADMIN) {
    return <Navigate to={ROUTES.forbidden} replace />
  }

  return <Outlet />
}
