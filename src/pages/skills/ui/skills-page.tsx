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
  Modal,
  ConfirmDialog,
  FormField,
  NativeSelect,
  PaginationBar,
  type Column,
} from '../../../shared/ui'
import { useDebouncedValue } from '../../../shared/lib'

const LIMIT = 10

interface SkillForm {
  name: string
  categoryId: number | ''
}

export function SkillsPage() {
  const queryClient = useQueryClient()

  const { data: categoriesData, isLoading: categoriesLoading } =
    useSkillCategoriesControllerFindAll()
  const categories: SkillCategoryResponse[] = categoriesData?.data ?? []

  // ── 선택된 카테고리(마스터) ──
  // 사용자가 고른 값은 state 로, "실제 선택"은 렌더 중 파생한다.
  // (state 를 effect 로 동기화하지 않아 목록 로드/삭제에도 자동으로 첫 항목으로 복구된다.)
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const selectedCategory =
    categories.find((c) => c.id === selectedCatId) ?? categories[0] ?? null
  const effectiveCatId = selectedCategory?.id ?? null

  // ── 스킬 목록(디테일): 선택 카테고리로 서버 조회 → 전체 캡 없음 ──
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

  const skills = skillsData?.data.items ?? []
  const total = skillsData?.data.metadata?.total ?? 0

  const invalidateSkills = () =>
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/skill-categories'] })
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  }

  const selectCategory = (id: number) => {
    setSelectedCatId(id)
    setPage(1)
    setSearch('')
  }

  // ── 카테고리 mutations & 모달 ──
  const catCreate = useSkillCategoriesControllerCreate({
    mutation: { onSuccess: invalidateAll },
  })
  const catUpdate = useSkillCategoriesControllerUpdate({
    mutation: { onSuccess: invalidateAll },
  })
  const catDelete = useSkillCategoriesControllerRemove({
    mutation: { onSuccess: invalidateAll },
  })
  const catMutating =
    catCreate.isPending || catUpdate.isPending || catDelete.isPending

  const [catEdit, setCatEdit] = useState<SkillCategoryResponse | 'new' | null>(
    null,
  )
  const [catName, setCatName] = useState('')
  const [catDeleteTarget, setCatDeleteTarget] =
    useState<SkillCategoryResponse | null>(null)

  const openCatCreate = () => {
    setCatName('')
    setCatEdit('new')
  }
  const openCatEdit = (c: SkillCategoryResponse) => {
    setCatName(c.name)
    setCatEdit(c)
  }
  const submitCat = async () => {
    const name = catName.trim()
    if (!name) return
    if (catEdit === 'new') {
      const created = await catCreate.mutateAsync({ data: { name } })
      const newId = created?.data?.id
      if (typeof newId === 'number') setSelectedCatId(newId)
    } else if (catEdit) {
      await catUpdate.mutateAsync({ id: catEdit.id, data: { name } })
    }
    setCatEdit(null)
  }
  const confirmCatDelete = async () => {
    if (!catDeleteTarget) return
    await catDelete.mutateAsync({ id: catDeleteTarget.id })
    setCatDeleteTarget(null)
  }

  // ── 스킬 mutations & 모달 ──
  const skillCreate = useSkillsControllerCreate({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillUpdate = useSkillsControllerUpdate({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillDelete = useSkillsControllerRemove({
    mutation: { onSuccess: invalidateSkills },
  })
  const skillMutating =
    skillCreate.isPending || skillUpdate.isPending || skillDelete.isPending

  const [skillEdit, setSkillEdit] = useState<SkillResponse | 'new' | null>(null)
  const [skillForm, setSkillForm] = useState<SkillForm>({
    name: '',
    categoryId: '',
  })
  const [skillDeleteTarget, setSkillDeleteTarget] =
    useState<SkillResponse | null>(null)

  const openSkillCreate = () => {
    setSkillForm({ name: '', categoryId: effectiveCatId ?? '' })
    setSkillEdit('new')
  }
  const openSkillEdit = (s: SkillResponse) => {
    setSkillForm({ name: s.name, categoryId: s.category.id })
    setSkillEdit(s)
  }
  const submitSkill = async () => {
    const name = skillForm.name.trim()
    if (!name || skillForm.categoryId === '') return
    const payload = { name, categoryId: skillForm.categoryId }
    if (skillEdit === 'new') await skillCreate.mutateAsync({ data: payload })
    else if (skillEdit)
      await skillUpdate.mutateAsync({ id: skillEdit.id, data: payload })
    setSkillEdit(null)
  }
  const confirmSkillDelete = async () => {
    if (!skillDeleteTarget) return
    await skillDelete.mutateAsync({ id: skillDeleteTarget.id })
    setSkillDeleteTarget(null)
  }

  const columns: Column<SkillResponse>[] = [
    { key: 'id', header: 'ID', render: (s) => s.id, className: 'w-16 text-muted' },
    { key: 'name', header: '이름', render: (s) => s.name },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (skill) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={() => openSkillEdit(skill)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setSkillDeleteTarget(skill)}
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
            <div className="flex items-center justify-between border-b border-divider px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                카테고리
              </span>
              <Button size="sm" variant="primary" onPress={openCatCreate}>
                추가
              </Button>
            </div>
            {categoriesLoading ? (
              <p className="px-3 py-4 text-sm text-muted">불러오는 중…</p>
            ) : categories.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted">
                카테고리를 추가하세요.
              </p>
            ) : (
              <ul className="p-1.5">
                {categories.map((c) => {
                  const active = c.id === effectiveCatId
                  return (
                    <li key={c.id}>
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
                            className={
                              active ? 'text-primary' : 'text-transparent'
                            }
                          >
                            ▸
                          </span>
                          {c.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => openCatEdit(c)}
                          className="rounded px-1 text-xs text-muted opacity-0 hover:text-foreground group-hover:opacity-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatDeleteTarget(c)}
                          className="rounded px-1 text-xs text-danger opacity-0 hover:opacity-70 group-hover:opacity-100"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  )
                })}
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {selectedCategory.name}
                </h2>
                <Button variant="primary" onPress={openSkillCreate}>
                  스킬 추가
                </Button>
              </div>

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

      {/* 카테고리 생성/수정 모달 */}
      <Modal
        isOpen={catEdit !== null}
        onClose={() => setCatEdit(null)}
        title={catEdit === 'new' ? '카테고리 추가' : '카테고리 수정'}
        footer={
          <>
            <Button
              variant="ghost"
              onPress={() => setCatEdit(null)}
              isDisabled={catMutating}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onPress={submitCat}
              isDisabled={catMutating || catName.trim() === ''}
            >
              {catMutating ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        <FormField label="이름">
          <Input
            autoFocus
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="카테고리 이름"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCat()
            }}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={catDeleteTarget !== null}
        title="카테고리 삭제"
        message={`"${catDeleteTarget?.name}" 카테고리를 삭제할까요? 소속된 스킬에 영향을 줄 수 있습니다.`}
        isPending={catMutating}
        onConfirm={confirmCatDelete}
        onClose={() => setCatDeleteTarget(null)}
      />

      {/* 스킬 생성/수정 모달 */}
      <Modal
        isOpen={skillEdit !== null}
        onClose={() => setSkillEdit(null)}
        title={skillEdit === 'new' ? '스킬 추가' : '스킬 수정'}
        footer={
          <>
            <Button
              variant="ghost"
              onPress={() => setSkillEdit(null)}
              isDisabled={skillMutating}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onPress={submitSkill}
              isDisabled={
                skillMutating ||
                skillForm.name.trim() === '' ||
                skillForm.categoryId === ''
              }
            >
              {skillMutating ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="이름">
            <Input
              autoFocus
              value={skillForm.name}
              onChange={(e) =>
                setSkillForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="스킬 이름"
            />
          </FormField>
          <FormField label="카테고리">
            <NativeSelect
              value={skillForm.categoryId}
              onChange={(e) =>
                setSkillForm((f) => ({
                  ...f,
                  categoryId: Number(e.target.value),
                }))
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={skillDeleteTarget !== null}
        title="스킬 삭제"
        message={`"${skillDeleteTarget?.name}" 을(를) 삭제할까요? 되돌릴 수 없습니다.`}
        isPending={skillMutating}
        onConfirm={confirmSkillDelete}
        onClose={() => setSkillDeleteTarget(null)}
      />
    </div>
  )
}
