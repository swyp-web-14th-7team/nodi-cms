import type { KeyboardEvent } from 'react'

/** 태그 관리 화면의 라이트 칩. 라벨 클릭=수정, ✕=삭제. */
export function TagChip({
  label,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  label: string
  /** ✕ 의 스크린리더 문구. 기본은 `"label 삭제"`. 지우는 게 아니면(예: 연결 해제) 바꿔 쓴다. */
  deleteLabel?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-[#e7ebf4] py-2 pr-2.5 pl-3.5 text-[15px] font-medium text-[#242736]">
      <button type="button" onClick={onEdit} className="hover:opacity-70">
        {label}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel ?? `${label} 삭제`}
        className="text-[#5b5f6e] hover:text-[#242736]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M3.5 3.5l7 7M10.5 3.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  )
}

/** 칩 크기에 맞춘 인라인 입력(추가/수정 공용). */
export function TagInput({
  value,
  onChange,
  placeholder,
  onEnter,
  onEscape,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onEnter: () => void
  onEscape: () => void
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onEnter()
    if (e.key === 'Escape') onEscape()
  }
  return (
    <input
      autoFocus
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onEscape}
      className="rounded-lg border border-accent bg-surface px-3.5 py-2 text-[15px] text-foreground outline-none placeholder:text-muted"
    />
  )
}
