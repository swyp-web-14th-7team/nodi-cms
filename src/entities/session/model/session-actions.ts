import {
  authControllerLogin,
  authControllerLogout,
  authControllerRefresh,
} from '../../../shared/api/endpoints/auth/auth'
import type { LoginDto } from '../../../shared/api/model'
import { useAuthStore } from './auth-store'

/**
 * 세션 관련 부수효과 액션. 생성된 API 함수를 호출하고 스토어를 갱신한다.
 * (React 훅이 아니라 어디서든 호출 가능한 순수 async 함수)
 */

/** OAuth 콜백에서 code/state 로 로그인하고 accessToken 을 저장한다. */
export async function loginWithOAuth(params: LoginDto): Promise<void> {
  const res = await authControllerLogin(params)
  useAuthStore.getState().setAccessToken(res.data.accessToken)
}

/** 쿠키의 refreshToken 으로 accessToken 을 재발급받아 세션을 복구한다. */
export async function restoreSession(): Promise<void> {
  const res = await authControllerRefresh()
  useAuthStore.getState().setAccessToken(res.data.accessToken)
}

/** 로그아웃: 서버 세션 무효화(실패해도) 후 메모리 토큰을 비운다. */
export async function logout(): Promise<void> {
  try {
    await authControllerLogout()
  } finally {
    useAuthStore.getState().clearAccessToken()
  }
}
