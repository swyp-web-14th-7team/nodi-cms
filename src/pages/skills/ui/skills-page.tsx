import { useState } from 'react'
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
import type {
  SkillResponse,
  SkillCategoryResponse,
} from '../../../shared/api/model'
import { TagChip, TagInput, PillButton } from '../../../shared/ui'
import { useUndoableDelete } from '../../../shared/lib'

// 서버가 허용하는 limit 상한(스펙상 최대 100).
const SKILL_PAGE_SIZE = 100

/**
 * 한 카테고리의 스킬을 마지막 페이지까지 훑어 모은다.
 * 카테고리당 100개를 넘는 경우가 흔하진 않지만, 넘으면 조용히 잘리므로 끝까지 따라간다.
 */
const fetchSkillsOfCategory = async (
  categoryId: number,
  signal?: AbortSignal,
) => {
  const items: SkillResponse[] = []
  for (let page = 1; ; page += 1) {
    const res = await skillsControllerFindAll(
      { categoryId, page, limit: SKILL_PAGE_SIZE },
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

export function SkillsPage() {
  const queryClient = useQueryClient()

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useSkillCategoriesControllerFindAll()
  const allCategories: SkillCategoryResponse[] = categoriesData?.data ?? []

  // 카테고리를 먼저 받고, 카테고리마다 자기 스킬만 병렬로 조회한다.
  const skillQueries = useQueries({
    queries: allCategories.map((category) => ({
      // '/skills' 프리픽스 유지 → 기존 invalidateQueries(['/skills']) 가 그대로 적중한다.
      queryKey: ['/skills', { categoryId: category.id }] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchSkillsOfCategory(category.id, signal),
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

  // ── 스킬 추가/수정 ──
  const [skillAddCatId, setSkillAddCatId] = useState<number | null>(null)
  const [skillAddName, setSkillAddName] = useState('')
  const [skillEditingId, setSkillEditingId] = useState<number | null>(null)
  const [skillEditName, setSkillEditName] = useState('')

  const openSkillAdd = (categoryId: number) => {
    setSkillAddCatId(categoryId)
    setSkillAddName('')
  }
  const submitSkillAdd = async (categoryId: number) => {
    const name = skillAddName.trim()
    if (!name) return
    await skillCreate.mutateAsync({ data: { name, categoryId } })
    setSkillAddName('') // 연속 입력을 위해 열어둔 채 비운다.
  }
  const submitSkillEdit = async () => {
    if (skillEditingId === null) return
    const name = skillEditName.trim()
    if (!name) return
    await skillUpdate.mutateAsync({ id: skillEditingId, data: { name } })
    setSkillEditingId(null)
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
        categories.map((category) => {
          const skills = skillUndo.filterVisible(
            skillsByCategory.get(category.id) ?? [],
            (s) => s.id,
          )
          return (
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
                      onClick={() =>
                        catUndo.request(category.id, category.name)
                      }
                      className="text-xs text-danger opacity-0 transition-opacity hover:opacity-70 group-hover:opacity-100"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>

              {/* 스킬 칩 */}
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) =>
                  skillEditingId === skill.id ? (
                    <TagInput
                      key={skill.id}
                      value={skillEditName}
                      onChange={setSkillEditName}
                      onEnter={submitSkillEdit}
                      onEscape={() => setSkillEditingId(null)}
                    />
                  ) : (
                    <TagChip
                      key={skill.id}
                      label={skill.name}
                      onEdit={() => {
                        setSkillEditingId(skill.id)
                        setSkillEditName(skill.name)
                      }}
                      onDelete={() => skillUndo.request(skill.id, skill.name)}
                    />
                  ),
                )}

                {skillAddCatId === category.id && (
                  <TagInput
                    value={skillAddName}
                    onChange={setSkillAddName}
                    placeholder="새 스킬"
                    onEnter={() => submitSkillAdd(category.id)}
                    onEscape={() => setSkillAddCatId(null)}
                  />
                )}
              </div>

              {/* 카테고리별 추가 + 구분선 */}
              <div className="flex justify-end">
                <PillButton onClick={() => openSkillAdd(category.id)} icon="+">
                  추가하기
                </PillButton>
              </div>
              <div className="border-t border-border" />
            </section>
          )
        })}

      {!isError && !isLoading && categories.length === 0 && (
        <p className="text-sm text-muted">
          카테고리가 없습니다. "카테고리 추가하기"로 먼저 만들어 주세요.
        </p>
      )}
    </div>
  )
}
