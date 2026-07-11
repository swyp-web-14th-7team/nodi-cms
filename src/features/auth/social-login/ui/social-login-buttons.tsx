import { Button } from '@heroui/react'
import { useSocialLogin, type SocialProvider } from '../model/use-social-login'

const PROVIDERS: { key: SocialProvider; label: string }[] = [
  { key: 'GOOGLE', label: 'Google 로 로그인' },
  { key: 'KAKAO', label: 'Kakao 로 로그인' },
  { key: 'NAVER', label: 'Naver 로 로그인' },
]

export function SocialLoginButtons() {
  const { start, loadingProvider } = useSocialLogin()

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map(({ key, label }) => (
        <Button
          key={key}
          variant="secondary"
          className="w-full"
          isDisabled={loadingProvider !== null}
          onPress={() => start(key)}
        >
          {loadingProvider === key ? '이동 중…' : label}
        </Button>
      ))}
    </div>
  )
}
