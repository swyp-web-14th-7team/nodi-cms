import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  loginWithOAuth,
  useAuthStore,
  UserRole,
} from '../../../entities/session'
import { LoginDtoProvider } from '../../../shared/api/model'
import { ROUTES } from '../../../shared/config'

/** 콜백 경로의 provider 파라미터(소문자) → LoginDtoProvider(대문자) */
const PROVIDER_PARAM_MAP: Record<string, LoginDtoProvider> = {
  google: LoginDtoProvider.GOOGLE,
  naver: LoginDtoProvider.NAVER,
  kakao: LoginDtoProvider.KAKAO,
}

/**
 * OAuth 콜백 처리 페이지. 라우트: /auth/:provider/callback
 * provider 가 ?code&state 를 붙여 이 라우트로 리다이렉트하면:
 *  1) URL 의 provider + code/state 로 /auth/login 호출
 *  2) 성공 시 accessToken 저장 → role 판별
 *  3) ADMIN 이면 대시보드, 아니면 권한없음 페이지로 이동
 */
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const { provider: providerParam } = useParams()
  const navigate = useNavigate()
  const ran = useRef(false) // StrictMode 이중 실행 방지

  const code = params.get('code')
  const state = params.get('state')
  const provider = providerParam ? PROVIDER_PARAM_MAP[providerParam] : undefined
  const isInvalid = !code || !state || !provider

  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    if (isInvalid || ran.current) return
    ran.current = true

    loginWithOAuth({ provider, code, state })
      .then(() => {
        const role = useAuthStore.getState().role
        navigate(role === UserRole.ADMIN ? ROUTES.dashboard : ROUTES.forbidden, {
          replace: true,
        })
      })
      .catch(() => {
        setLoginError(true)
      })
  }, [isInvalid, provider, code, state, navigate])

  const errorMessage = isInvalid
    ? '잘못된 접근입니다. 다시 로그인해 주세요.'
    : loginError
      ? '로그인에 실패했습니다. 다시 시도해 주세요.'
      : null

  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-6">
      {errorMessage ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-danger">{errorMessage}</p>
          <button
            className="text-sm text-primary underline"
            onClick={() => navigate(ROUTES.login, { replace: true })}
          >
            로그인으로 돌아가기
          </button>
        </div>
      ) : (
        <p className="text-muted">로그인 처리 중…</p>
      )}
    </div>
  )
}
