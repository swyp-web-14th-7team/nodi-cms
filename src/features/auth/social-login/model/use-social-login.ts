import { useState } from 'react'
import {
  authControllerGetGoogleLoginUrl,
  authControllerGetKakaoLoginUrl,
  authControllerGetNaverLoginUrl,
} from '../../../../shared/api/endpoints/auth/auth'

/** CMS 로그인에 사용하는 소셜 provider (백엔드 GET URL 엔드포인트가 있는 것만). */
export type SocialProvider = 'GOOGLE' | 'KAKAO' | 'NAVER'

const urlFetchers: Record<
  SocialProvider,
  () => Promise<{ data: { url: string } }>
> = {
  GOOGLE: authControllerGetGoogleLoginUrl,
  KAKAO: authControllerGetKakaoLoginUrl,
  NAVER: authControllerGetNaverLoginUrl,
}

/**
 * 백엔드에서 provider 인증 URL 을 받아 브라우저를 그 URL 로 이동시킨다.
 * 로그인 후 provider 는 /auth/{provider}/callback 로 돌아오므로(경로에 provider 포함)
 * 별도 저장 없이 콜백 페이지가 URL 파라미터로 provider 를 알 수 있다.
 */
export const useSocialLogin = () => {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null,
  )

  const start = async (provider: SocialProvider) => {
    setLoadingProvider(provider)
    try {
      const res = await urlFetchers[provider]()
      window.location.href = res.data.url
    } catch {
      setLoadingProvider(null)
    }
  }

  return { start, loadingProvider }
}
