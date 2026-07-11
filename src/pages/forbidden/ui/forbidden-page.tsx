import { Card, CardContent, CardHeader } from '@heroui/react'
import { LogoutButton } from '../../../features/auth'

/** 로그인은 됐지만 관리자(ADMIN)가 아닌 사용자에게 보여주는 페이지. */
export function ForbiddenPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold text-foreground">접근 권한 없음</h1>
          <p className="text-sm text-muted">
            이 CMS 는 관리자만 사용할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="flex justify-end">
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  )
}
