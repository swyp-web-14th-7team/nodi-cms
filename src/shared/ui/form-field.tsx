import type { ReactNode, SelectHTMLAttributes } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  htmlFor?: string
}

/** 라벨 + 입력 + 에러메시지를 세로로 묶는 폼 필드 래퍼. */
export function FormField({ label, children, error, htmlFor }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

/** HeroUI Input 과 시각적으로 맞춘 네이티브 select (react-aria Select 결선 회피용). */
export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props
  return (
    <select
      {...rest}
      className={`h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-accent ${className ?? ''}`}
    />
  )
}
