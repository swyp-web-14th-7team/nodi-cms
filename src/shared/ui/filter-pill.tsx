import type { ReactNode } from 'react'

/** 목록 필터의 알약 토글. 선택된 것만 반전시켜 눈에 띄게 한다. */
export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'bg-surface-secondary text-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
