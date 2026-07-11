import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@heroui/react'

interface PlaceholderPageProps {
  title: string
  description?: string
  children?: ReactNode
}

/**
 * 아직 내용이 없는 CMS 페이지의 공통 뼈대.
 * 실제 기능(테이블/폼 등)이 붙기 전까지 각 페이지가 이 컴포넌트로 자리를 잡는다.
 */
export function PlaceholderPage({
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-base font-medium text-foreground">준비 중</h2>
        </CardHeader>
        <CardContent>
          {children ?? (
            <p className="text-sm text-muted">
              이 화면은 아직 골격만 있습니다. 여기에 목록·상세·폼을 붙이면 됩니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
