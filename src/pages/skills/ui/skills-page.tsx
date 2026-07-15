import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import {
  useSkillsControllerFindAll,
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
import {
  PageHeader,
  DataTable,
  PaginationBar,
  type Column,
} from '../../../shared/ui'
import { useDebouncedValue, useUndoableDelete } from '../../../shared/lib'

const LIMIT = 10

export function SkillsPage() {
  const queryClient = useQueryClient()

  const { data: categoriesData, isLoading: categoriesLoading } =
    useSkillCategoriesControllerFindAll()
  const allCategories: SkillCategoryResponse[] = categoriesData?.data ?? []

  const invalidateSkills = () =>
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/skill-categories'] })
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  }

  // ── 카테고리 mutations ──
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
  const categories = catUndo.filterVisible(allCategories, (c) => c.id)

  // ── 선택 카테고리(마스터): 렌더 파생값 ──
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const selectedCategory =
    categories.find((c) => c.id === selectedCatId) ?? categories[0] ?? null
  const effectiveCatId = selectedCategory?.id ?? null

  // ── 스킬 목록(디테일) ──
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data: skillsData, isLoading: skillsLoading, isError: skillsError } =
    useSkillsControllerFindAll(
      {
        page,
        limit: LIMIT,
        ...(effectiveCatId !== null ? { categoryId: effectiveCatId } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      },
      { query: { enabled: effectiveCatId !== null } },
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
  const skills = skillUndo.filterVisible(
    skillsData?.data.items ?? [],
    (s) => s.id,
  )
  const total = skillsData?.data.metadata?.total ?? 0

  const selectCategory = (id: number) => {
    setSelectedCatId(id)
    setPage(1)
    setSearch('')
  }

  // ── 카테고리 인라인 추가/수정 ──
  const [catAddName, setCatAddName] = useState('')
  const [catEditingId, setCatEditingId] = useState<number | null>(null)
  const [catEditName, setCatEditName] = useState('')

  const submitCatAdd = async () => {
    const name = catAddName.trim()
    if (!name) return
    const created = await catCreate.mutateAsync({ data: { name } })
    const newId = created?.data?.id
    if (typeof newId === 'number') setSelectedCatId(newId)
    setCatAddName('')
  }
  const submitCatEdit = async () => {
    if (catEditingId === null) return
    const name = catEditName.trim()
    if (!name) return
    await catUpdate.mutateAsync({ id: catEditingId, data: { name } })
    setCatEditingId(null)
  }

  // ── 스킬 인라인 추가/수정 ──
  const [skillAddName, setSkillAddName] = useState('')
  const [skillEditingId, setSkillEditingId] = useState<number | null>(null)
  const [skillEditName, setSkillEditName] = useState('')

  const submitSkillAdd = async () => {
    const name = skillAddName.trim()
    if (!name || effectiveCatId === null) return
    await skillCreate.mutateAsync({
      data: { name, categoryId: effectiveCatId },
    })
    setSkillAddName('')
  }
  const submitSkillEdit = async () => {
    if (skillEditingId === null) return
    const name = skillEditName.trim()
    if (!name) return
    await skillUpdate.mutateAsync({ id: skillEditingId, data: { name } })
    setSkillEditingId(null)
  }

  const columns: Column<SkillResponse>[] = [
    { key: 'id', header: 'ID', render: (s) => s.id, className: 'w-16 text-muted' },
    {
      key: 'name',
      header: '이름',
      render: (skill) =>
        skillEditingId === skill.id ? (
          <Input
            autoFocus
            value={skillEditName}
            onChange={(e) => setSkillEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSkillEdit()
              if (e.key === 'Escape') setSkillEditingId(null)
            }}
            className="max-w-xs"
          />
        ) : (
          skill.name
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (skill) =>
        skillEditingId === skill.id ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              onPress={submitSkillEdit}
              isDisabled={skillUpdate.isPending || skillEditName.trim() === ''}
            >
              저장
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setSkillEditingId(null)}
            >
              취소
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setSkillEditingId(skill.id)
                setSkillEditName(skill.name)
              }}
            >
              수정
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              onPress={() => skillUndo.request(skill.id, skill.name)}
            >
              삭제
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="스킬"
        description="왼쪽에서 카테고리를 선택하고, 오른쪽에서 해당 스킬을 관리합니다."
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* 마스터: 카테고리 */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-lg border border-divider">
            <div className="border-b border-divider px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                카테고리
              </span>
            </div>
            {categoriesLoading ? (
              <p className="px-3 py-4 text-sm text-muted">불러오는 중…</p>
            ) : (
              <ul className="p-1.5">
                {categories.map((c) => {
                  const active = c.id === effectiveCatId
                  const editing = catEditingId === c.id
                  return (
                    <li key={c.id}>
                      {editing ? (
                        <div className="flex items-center gap-1 p-1">
                          <Input
                            autoFocus
                            value={catEditName}
                            onChange={(e) => setCatEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitCatEdit()
                              if (e.key === 'Escape') setCatEditingId(null)
                            }}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={submitCatEdit}
                            className="rounded px-1 text-xs text-primary hover:opacity-70"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatEditingId(null)}
                            className="rounded px-1 text-xs text-muted hover:text-foreground"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`group flex items-center gap-1 rounded-md border-l-[3px] py-1.5 pr-2 pl-2 text-sm transition-colors ${
                            active
                              ? 'border-primary bg-primary/10 font-semibold text-primary'
                              : 'border-transparent text-foreground/80 hover:bg-content2'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectCategory(c.id)}
                            className="flex flex-1 items-center gap-1.5 truncate text-left"
                          >
                            <span
                              aria-hidden
                              className={active ? 'text-primary' : 'text-transparent'}
                            >
                              ▸
                            </span>
                            {c.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCatEditingId(c.id)
                              setCatEditName(c.name)
                            }}
                            className="rounded px-1 text-xs text-muted opacity-0 hover:text-foreground group-hover:opacity-100"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => catUndo.request(c.id, c.name)}
                            className="rounded px-1 text-xs text-danger opacity-0 hover:opacity-70 group-hover:opacity-100"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}

                {/* 인라인 추가 */}
                <li className="mt-1 flex items-center gap-1 border-t border-divider p-1 pt-2">
                  <Input
                    value={catAddName}
                    onChange={(e) => setCatAddName(e.target.value)}
                    placeholder="새 카테고리"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCatAdd()
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={submitCatAdd}
                    isDisabled={catCreate.isPending || catAddName.trim() === ''}
                  >
                    추가
                  </Button>
                </li>
              </ul>
            )}
          </div>
        </aside>

        {/* 디테일: 선택 카테고리의 스킬 */}
        <section className="flex min-w-0 flex-1 flex-col gap-3">
          {selectedCategory === null ? (
            <div className="rounded-lg border border-divider px-4 py-16 text-center text-sm text-muted">
              {categories.length === 0
                ? '먼저 카테고리를 추가하면 스킬을 관리할 수 있습니다.'
                : '카테고리를 선택하세요.'}
            </div>
          ) : (
            <>
              <h2 className="truncate text-lg font-semibold text-foreground">
                {selectedCategory.name}
              </h2>

              <Input
                type="search"
                placeholder="이 카테고리에서 스킬 검색"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="max-w-xs"
              />

              {/* 인라인 추가 */}
              <div className="flex items-center gap-2 rounded-lg border border-divider bg-content2/50 p-2">
                <Input
                  value={skillAddName}
                  onChange={(e) => setSkillAddName(e.target.value)}
                  placeholder="새 스킬 이름"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitSkillAdd()
                  }}
                  className="max-w-xs"
                />
                <Button
                  variant="primary"
                  onPress={submitSkillAdd}
                  isDisabled={skillCreate.isPending || skillAddName.trim() === ''}
                >
                  추가
                </Button>
              </div>

              <DataTable
                columns={columns}
                items={skills}
                rowKey={(s) => s.id}
                isLoading={skillsLoading}
                isError={skillsError}
                emptyMessage="이 카테고리에 등록된 스킬이 없습니다."
              />

              {total > 0 && (
                <PaginationBar
                  page={page}
                  total={total}
                  limit={LIMIT}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
