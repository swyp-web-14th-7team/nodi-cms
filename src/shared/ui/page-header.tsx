import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /** 우측 액션 영역(추가 버튼 등). */
  actions?: ReactNode
}

/** CMS 각 페이지 상단의 공통 헤더(제목 + 설명 + 우측 액션). */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
