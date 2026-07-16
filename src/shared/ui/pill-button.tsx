import type { ReactNode } from 'react'

/** 태그 관리 화면의 어두운 알약 버튼. */
export function PillButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  icon?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary disabled:opacity-60"
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      {children}
    </button>
  )
}
