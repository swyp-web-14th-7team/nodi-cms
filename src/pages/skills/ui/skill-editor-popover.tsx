import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@heroui/react'
import type { JobTypeResponse } from '../../../shared/api/model'

export interface SkillEditorValues {
  name: string
  jobTypeIds: number[]
}

/**
 * 스킬의 이름과 직군을 함께 고치는 팝오버. 부모가 relative 컨테이너를 잡아준다.
 *
 * 직군은 1개 이상이어야 한다(서버가 빈 배열을 거부한다 — 매핑이 없는 상태와
 * "아직 지정 안 함"을 구분할 수 없어서다). 이름만 받던 예전 인라인 입력으로는
 * 스킬을 만들 수 없으므로 추가·수정 모두 이 팝오버를 쓴다.
 */
export function SkillEditorPopover({
  initialName,
  initialJobTypeIds,
  jobTypes,
  submitLabel,
  isPending,
  align = 'left',
  onSubmit,
  onClose,
}: {
  initialName: string
  initialJobTypeIds: number[]
  jobTypes: JobTypeResponse[]
  submitLabel: string
  isPending: boolean
  /** 팝오버가 넘칠 방향. 오른쪽 끝에 붙은 트리거는 'right' 로 뒤집는다. */
  align?: 'left' | 'right'
  onSubmit: (values: SkillEditorValues) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [jobTypeIds, setJobTypeIds] = useState(initialJobTypeIds)
  const ref = useRef<HTMLDivElement>(null)

  // 바깥 클릭 / Escape 로 닫는다.
  // 여는 클릭의 mousedown 은 이 이펙트가 붙기 전에 이미 끝나므로 즉시 닫히지 않는다.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const toggle = (id: number) =>
    setJobTypeIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    )

  const allSelected =
    jobTypes.length > 0 && jobTypeIds.length === jobTypes.length
  const toggleAll = () =>
    setJobTypeIds(allSelected ? [] : jobTypes.map((jt) => jt.id))

  const trimmedName = name.trim()
  const canSubmit = trimmedName !== '' && jobTypeIds.length > 0 && !isPending

  const submit = () => {
    if (!canSubmit) return
    onSubmit({ name: trimmedName, jobTypeIds })
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div
      ref={ref}
      className={`absolute top-full z-30 mt-2 w-60 rounded-lg border border-border bg-surface p-4 shadow-xl ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="skill-editor-name"
            className="text-xs font-medium text-muted"
          >
            이름
          </label>
          <input
            id="skill-editor-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="스킬 이름"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">직군</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-muted hover:text-foreground"
            >
              {allSelected ? '전체 해제' : '전 직군 공통'}
            </button>
          </div>
          {jobTypes.map((jt) => (
            <label
              key={jt.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                checked={jobTypeIds.includes(jt.id)}
                onChange={() => toggle(jt.id)}
                className="h-4 w-4 accent-[var(--foreground)]"
              />
              {jt.name}
            </label>
          ))}
          {jobTypeIds.length === 0 && (
            <p className="text-xs text-danger">직군을 1개 이상 고르세요.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onPress={onClose}
            isDisabled={isPending}
          >
            취소
          </Button>
          <Button
            size="sm"
            variant="primary"
            onPress={submit}
            isDisabled={!canSubmit}
          >
            {isPending ? '저장 중…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
