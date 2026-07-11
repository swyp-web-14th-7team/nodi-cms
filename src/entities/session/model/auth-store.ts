import { create } from 'zustand'
import { registerAuthTokenAccessor } from '../../../shared/api/http-client'
import { decodeJwtPayload } from '../../../shared/lib'
import { UserRole } from './user-role'

/**
 * accessToken 전역 상태 (session 엔티티).
 *
 * - accessToken 은 메모리에만 보관(localStorage 미사용, XSS 대비).
 * - role 은 accessToken JWT payload 에서 디코드해 함께 보관한다.
 *   전 페이지 접근은 role === UserRole.ADMIN 조건으로 게이팅한다.
 * - refreshToken 은 서버가 httpOnly 쿠키로 관리한다.
 */
interface AccessTokenClaims {
  role?: number
  sub?: string
  exp?: number
}

interface AuthState {
  accessToken: string | null
  role: UserRole | null
  isBootstrapping: boolean
  setAccessToken: (token: string) => void
  clearAccessToken: () => void
  setBootstrapped: () => void
}

/** accessToken payload 에서 role 을 뽑아 UserRole 로 정규화한다. */
const roleFromToken = (token: string): UserRole | null => {
  const claims = decodeJwtPayload<AccessTokenClaims>(token)
  if (claims?.role === UserRole.ADMIN) return UserRole.ADMIN
  if (claims?.role === UserRole.USER) return UserRole.USER
  return null
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  isBootstrapping: true,
  setAccessToken: (token) =>
    set({ accessToken: token, role: roleFromToken(token) }),
  clearAccessToken: () => set({ accessToken: null, role: null }),
  setBootstrapped: () => set({ isBootstrapping: false }),
}))

// ── 파생 셀렉터 훅 ──
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.accessToken !== null)

export const useIsAdmin = () => useAuthStore((s) => s.role === UserRole.ADMIN)

// shared/api(axios 인터셉터)가 토큰을 읽고 쓸 수 있도록 접근자를 주입한다.
// entities → shared 방향이라 FSD 레이어 규칙을 지킨다.
registerAuthTokenAccessor({
  getToken: () => useAuthStore.getState().accessToken,
  setToken: (token) => useAuthStore.getState().setAccessToken(token),
  clearToken: () => useAuthStore.getState().clearAccessToken(),
})
