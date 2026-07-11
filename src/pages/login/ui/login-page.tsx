import { Card, CardContent, CardHeader } from '@heroui/react'
import { SocialLoginButtons } from '../../../features/auth'

export function LoginPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold text-foreground">nodi CMS</h1>
          <p className="text-sm text-muted">관리자 계정으로 로그인하세요.</p>
        </CardHeader>
        <CardContent>
          <SocialLoginButtons />
        </CardContent>
      </Card>
    </div>
  )
}
