import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, Input } from '@heroui/react'
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
  Modal,
  ConfirmDialog,
  FormField,
  NativeSelect,
} from '../../../shared/ui'

// 스킬은 페이지네이션 API 이지만 카테고리별 그룹핑을 위해 한 번에 넉넉히 불러온다.
const SKILL_FETCH_LIMIT = 200

interface SkillForm {
  name: string
  categoryId: number | ''
}

export function SkillsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: categoriesData, isLoading: categoriesLoading } =
    useSkillCategoriesControllerFindAll()
  const { data: skillsData, isLoading: skillsLoading } =
    useSkillsControllerFindAll({ limit: SKILL_FETCH_LIMIT })

  const categories: SkillCategoryResponse[] = categoriesData?.data ?? []
  const skills = useMemo<SkillResponse[]>(
    () => skillsData?.data.items ?? [],
    [skillsData],
  )

  const invalidateSkills = () =>
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['/skill-categories'] })
    queryClient.invalidateQueries({ queryKey: ['/skills'] })
  }

  // ── 카테고리 mutations ──
  const catCreate = useSkillCategoriesControllerCreate({
    mutation: { onSuccess: invalidateCategories },
  })
  const catUpdate = useSkillCategoriesControllerUpdate({
    mutation: { onSuccess: invalidateCategories },
  })
  const catDelete = useSkillCategoriesControllerRemove({
    mutation: { onSuccess: invalidateCategories },
  })
  const catMutating =
    catCreate.isPending || catUpdate.isPending || catDelete.isPending

  // ── 스킬 mutations ──
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

  // ── 카테고리 모달 상태 ──
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
    if (catEdit === 'new') await catCreate.mutateAsync({ data: { name } })
    else if (catEdit)
      await catUpdate.mutateAsync({ id: catEdit.id, data: { name } })
    setCatEdit(null)
  }
  const confirmCatDelete = async () => {
    if (!catDeleteTarget) return
    await catDelete.mutateAsync({ id: catDeleteTarget.id })
    setCatDeleteTarget(null)
  }

  // ── 스킬 모달 상태 ──
  const [skillEdit, setSkillEdit] = useState<SkillResponse | 'new' | null>(null)
  const [skillForm, setSkillForm] = useState<SkillForm>({
    name: '',
    categoryId: '',
  })
  const [skillDeleteTarget, setSkillDeleteTarget] =
    useState<SkillResponse | null>(null)

  const openSkillCreate = (categoryId: number) => {
    setSkillForm({ name: '', categoryId })
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

  // ── 검색 필터 + 카테고리별 그룹핑 ──
  const keyword = search.trim().toLowerCase()
  const skillsByCategory = useMemo(() => {
    const map = new Map<number, SkillResponse[]>()
    for (const skill of skills) {
      if (keyword && !skill.name.toLowerCase().includes(keyword)) continue
      const list = map.get(skill.category.id) ?? []
      list.push(skill)
      map.set(skill.category.id, list)
    }
    return map
  }, [skills, keyword])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="스킬"
        description="카테고리와 카테고리별 스킬을 함께 관리합니다."
      />

      {/* 상단: 카테고리 관리 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">
            스킬 카테고리
          </h2>
          <Button size="sm" variant="primary" onPress={openCatCreate}>
            카테고리 추가
          </Button>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted">등록된 카테고리가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md border border-divider bg-content2 py-1 pl-3 pr-1.5 text-sm"
                >
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted">
                    ({skills.filter((s) => s.category.id === c.id).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => openCatEdit(c)}
                    className="rounded px-1 text-xs text-muted hover:text-foreground"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatDeleteTarget(c)}
                    className="rounded px-1 text-xs text-danger hover:opacity-70"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 하단: 카테고리별 스킬 */}
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          placeholder="스킬 이름으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {skillsLoading ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">
            먼저 카테고리를 추가하면 스킬을 등록할 수 있습니다.
          </p>
        ) : (
          categories.map((category) => {
            const list = skillsByCategory.get(category.id) ?? []
            return (
              <Card key={category.id}>
                <CardHeader className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    {category.name}
                    <span className="ml-2 text-muted">{list.length}개</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => openSkillCreate(category.id)}
                  >
                    스킬 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted">
                      {keyword
                        ? '검색 결과가 없습니다.'
                        : '등록된 스킬이 없습니다.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {list.map((skill) => (
                        <div
                          key={skill.id}
                          className="flex items-center gap-2 rounded-md border border-divider py-1 pl-3 pr-1.5 text-sm"
                        >
                          <span className="text-foreground">{skill.name}</span>
                          <button
                            type="button"
                            onClick={() => openSkillEdit(skill)}
                            className="rounded px-1 text-xs text-muted hover:text-foreground"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkillDeleteTarget(skill)}
                            className="rounded px-1 text-xs text-danger hover:opacity-70"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
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
