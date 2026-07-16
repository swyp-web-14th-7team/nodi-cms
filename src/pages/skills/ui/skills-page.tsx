import { useCallback, useState, type ReactNode } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import {
  skillsControllerFindAll,
  useSkillsControllerCreate,
  useSkillsControllerUpdate,
  useSkillsControllerRemove,
} from '../../../shared/api/endpoints/skills/skills'
import {
  useSkillCategoriesControllerFindAll,
  useSkillCategoriesControllerCreate,
  useSkillCategoriesControllerUpdate,
  useSkillCategoriesControllerRemove,
} from '../../../shared/api/endpoints/skill-categories/skill-categories'
import { useJobTypeControllerFindAll } from '../../../shared/api/endpoints/job-type/job-type'
import type {
  SkillResponse,
  SkillCategoryResponse,
  JobTypeResponse,
} from '../../../shared/api/model'
import { TagChip, TagInput, PillButton } from '../../../shared/ui'
import { useUndoableDelete } from '../../../shared/lib'
import {
  SkillEditorPopover,
  type SkillEditorValues,
} from './skill-editor-popover'

// 서버가 허용하는 limit 상한(스펙상 최대 100).
const SKILL_PAGE_SIZE = 100

/**
 * 한 카테고리의 스킬을 마지막 페이지까지 훑어 모은다.
 * 카테고리당 100개를 넘는 경우가 흔하진 않지만, 넘으면 조용히 잘리므로 끝까지 따라간다.
 */
const fetchSkillsOfCategory = async (
  categoryId: number,
  jobTypeId: number | null,
  signal?: AbortSignal,
) => {
  const items: SkillResponse[] = []
  for (let page = 1; ; page += 1) {
    const res = await skillsControllerFindAll(
      {
        categoryId,
        page,
        limit: SKILL_PAGE_SIZE,
        ...(jobTypeId !== null ? { jobTypeId } : {}),
      },
      undefined,
      signal,
    )
    const pageItems = res.data.items ?? []
    items.push(...pageItems)
    const total = res.data.metadata?.total ?? items.length
    if (pageItems.length === 0 || items.length >= total) break
  }
  return items
}

// 팝오버가 붙은 대상. 카테고리의 추가 버튼이거나, 특정 스킬 칩이다.
// add 는 미리 체크해둘 직군을 함께 들고 있는다(연속 추가 때 직전 선택을 잇기 위해).
type EditorTarget =
  | { kind: 'add'; categoryId: number; jobTypeIds: number[] }
  | { kind: 'edit'; skill: SkillResponse }
  | null

export function SkillsPage() {
  const queryClient = useQueryClient()

  // null = 전체. 고르면 그 직군에 매핑된 스킬만 남는다.
  const [jobTypeFilter, setJobTypeFilter] = useState<number | null>(null)

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useSkillCategoriesControllerFindAll()
  const allCategories: SkillCategoryResponse[] = categoriesData?.data ?? []

  const { data: jobTypesData } = useJobTypeControllerFindAll({
    page: 1,
    limit: 100,
  })
  const jobTypes: JobTypeResponse[] = jobTypesData?.data.items ?? []

  // 카테고리를 먼저 받고, 카테고리마다 자기 스킬만 병렬로 조회한다.
  const skillQueries = useQueries({
    queries: allCategories.map((category) => ({
      // '/skills' 프리픽스 유지 → 기존 invalidateQueries(['/skills']) 가 그대로 적중한다.
      queryKey: [
        '/skills',
        { categoryId: category.id, jobTypeId: jobTypeFilter },
      ] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchSkillsOfCategory(category.id, jobTypeFilter, signal),
    })),
  })

  const isLoading = categoriesLoading || skillQueries.some((q) => q.isLoading)
  const isError = categoriesError || skillQueries.some((q) => q.isError)

  const invalidateSkills = () =>
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/skill-categories'] })
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  }

  // ── mutations ──
  const catCreate = useSkillCategoriesControllerCreate({
    mutation: { onSuccess: invalidateAll },
  })
  const catUpdate = useSkillCategoriesControllerUpdate({
    mutation: { onSuccess: invalidateAll },
  })
  const catDelete = useSkillCategoriesControllerRemove({
    mutation: { onSuccess: invalidateAll },
  })
  const catUndo = useUndoableDelete<number>((id) =>
    catDelete.mutateAsync({ id }),
  )

  const skillCreate = useSkillsControllerCreate({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillUpdate = useSkillsControllerUpdate({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillDelete = useSkillsControllerRemove({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillUndo = useUndoableDelete<number>((id) =>
    skillDelete.mutateAsync({ id }),
  )

  const categories = catUndo.filterVisible(allCategories, (c) => c.id)
  // skillQueries 는 allCategories 와 같은 순서라 인덱스로 짝지어진다.
  const skillsByCategory = new Map<number, SkillResponse[]>(
    allCategories.map((category, i) => [
      category.id,
      skillQueries[i]?.data ?? [],
    ]),
  )

  // 직군을 걸러 보는 중이면 빈 카테고리는 숨긴다(빈 제목만 줄줄이 남지 않게).
  // 전체를 볼 땐 남겨둬야 그 카테고리에 스킬을 추가할 수 있다.
  const sections = categories
    .map((category) => ({
      category,
      skills: skillUndo.filterVisible(
        skillsByCategory.get(category.id) ?? [],
        (s) => s.id,
      ),
    }))
    .filter(({ skills }) => jobTypeFilter === null || skills.length > 0)

  // ── 카테고리 추가/수정 ──
  const [catAdding, setCatAdding] = useState(false)
  const [catAddName, setCatAddName] = useState('')
  const [catEditingId, setCatEditingId] = useState<number | null>(null)
  const [catEditName, setCatEditName] = useState('')

  const submitCatAdd = async () => {
    const name = catAddName.trim()
    if (!name) return
    await catCreate.mutateAsync({ data: { name } })
    setCatAddName('')
    setCatAdding(false)
  }
  const submitCatEdit = async () => {
    if (catEditingId === null) return
    const name = catEditName.trim()
    if (!name) return
    await catUpdate.mutateAsync({ id: catEditingId, data: { name } })
    setCatEditingId(null)
  }

  // ── 스킬 추가/수정(팝오버) ──
  const [target, setTarget] = useState<EditorTarget>(null)
  // 연속 추가용. 저장할 때마다 올려서 팝오버를 새로 마운트한다(이름만 비고 직군은 남는다).
  const [addSeq, setAddSeq] = useState(0)
  const [lastJobTypeIds, setLastJobTypeIds] = useState<number[]>([])

  const closeEditor = useCallback(() => setTarget(null), [])

  // 추가 팝오버를 열 때 미리 체크해둘 직군: 필터 중이면 그 직군, 아니면 직전에 쓴 직군.
  const openAdd = (categoryId: number) =>
    setTarget({
      kind: 'add',
      categoryId,
      jobTypeIds: jobTypeFilter !== null ? [jobTypeFilter] : lastJobTypeIds,
    })

  const submitEditor = async (values: SkillEditorValues) => {
    if (!target) return
    if (target.kind === 'add') {
      await skillCreate.mutateAsync({
        data: {
          name: values.name,
          categoryId: target.categoryId,
          jobTypeIds: values.jobTypeIds,
        },
      })
      // 연속 입력을 위해 팝오버를 열어둔 채 새로 마운트한다.
      // 방금 고른 직군을 그대로 물려줘야 같은 직군의 스킬을 연달아 넣기 쉽다.
      setLastJobTypeIds(values.jobTypeIds)
      setTarget({ ...target, jobTypeIds: values.jobTypeIds })
      setAddSeq((n) => n + 1)
      return
    }
    await skillUpdate.mutateAsync({
      id: target.skill.id,
      data: { name: values.name, jobTypeIds: values.jobTypeIds },
    })
    closeEditor()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">스킬 태그 관리</h1>
        <PillButton onClick={() => setCatAdding((v) => !v)}>
          카테고리 추가하기
        </PillButton>
      </div>

      {catAdding && (
        <div className="flex items-center gap-2">
          <TagInput
            value={catAddName}
            onChange={setCatAddName}
            placeholder="새 카테고리 이름"
            onEnter={submitCatAdd}
            onEscape={() => setCatAdding(false)}
          />
          <PillButton onClick={submitCatAdd} disabled={catCreate.isPending}>
            추가
          </PillButton>
        </div>
      )}

      {/* 직군 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[15px] text-muted">직군</span>
        <FilterPill
          active={jobTypeFilter === null}
          onClick={() => setJobTypeFilter(null)}
        >
          전체
        </FilterPill>
        {jobTypes.map((jt) => (
          <FilterPill
            key={jt.id}
            active={jobTypeFilter === jt.id}
            onClick={() => setJobTypeFilter(jt.id)}
          >
            {jt.name}
          </FilterPill>
        ))}
      </div>

      {isError && (
        <p className="text-sm text-danger">
          목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {!isError && isLoading && (
        <p className="text-sm text-muted">불러오는 중…</p>
      )}

      {!isError &&
        !isLoading &&
        sections.map(({ category, skills }) => (
          <section key={category.id} className="flex flex-col gap-4">
            {/* 카테고리 라벨 */}
            <div className="group flex items-center gap-2">
              {catEditingId === category.id ? (
                <TagInput
                  value={catEditName}
                  onChange={setCatEditName}
                  onEnter={submitCatEdit}
                  onEscape={() => setCatEditingId(null)}
                />
              ) : (
                <>
                  <h2 className="text-[15px] text-muted">{category.name}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setCatEditingId(category.id)
                      setCatEditName(category.name)
                    }}
                    className="text-xs text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => catUndo.request(category.id, category.name)}
                    className="text-xs text-danger opacity-0 transition-opacity hover:opacity-70 group-hover:opacity-100"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>

            {/* 스킬 칩. 칩을 누르면 이름·직군 팝오버가 그 자리에 열린다. */}
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div key={skill.id} className="relative">
                  <TagChip
                    label={skill.name}
                    onEdit={() => setTarget({ kind: 'edit', skill })}
                    onDelete={() => skillUndo.request(skill.id, skill.name)}
                  />
                  {target?.kind === 'edit' && target.skill.id === skill.id && (
                    <SkillEditorPopover
                      initialName={skill.name}
                      initialJobTypeIds={skill.jobTypes.map((jt) => jt.id)}
                      jobTypes={jobTypes}
                      submitLabel="저장"
                      isPending={skillUpdate.isPending}
                      onSubmit={submitEditor}
                      onClose={closeEditor}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 카테고리별 추가 + 구분선 */}
            <div className="flex justify-end">
              <div className="relative">
                <PillButton onClick={() => openAdd(category.id)} icon="+">
                  추가하기
                </PillButton>
                {target?.kind === 'add' &&
                  target.categoryId === category.id && (
                    <SkillEditorPopover
                      key={addSeq}
                      initialName=""
                      initialJobTypeIds={target.jobTypeIds}
                      jobTypes={jobTypes}
                      submitLabel="추가"
                      isPending={skillCreate.isPending}
                      align="right"
                      onSubmit={submitEditor}
                      onClose={closeEditor}
                    />
                  )}
              </div>
            </div>
            <div className="border-t border-border" />
          </section>
        ))}

      {!isError && !isLoading && categories.length === 0 && (
        <p className="text-sm text-muted">
          카테고리가 없습니다. "카테고리 추가하기"로 먼저 만들어 주세요.
        </p>
      )}
      {!isError &&
        !isLoading &&
        categories.length > 0 &&
        sections.length === 0 && (
          <p className="text-sm text-muted">
            이 직군으로 지정된 스킬이 없습니다.
          </p>
        )}
    </div>
  )
}

/** 직군 필터의 알약 토글. 선택된 것만 반전시켜 눈에 띄게 한다. */
function FilterPill({
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
