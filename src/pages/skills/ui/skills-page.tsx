import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import {
  useSkillsControllerFindAll,
  useSkillsControllerCreate,
  useSkillsControllerUpdate,
  useSkillsControllerRemove,
} from '../../../shared/api/endpoints/skills/skills'
import { useSkillCategoriesControllerFindAll } from '../../../shared/api/endpoints/skill-categories/skill-categories'
import type {
  SkillResponse,
  SkillsControllerFindAllParams,
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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const debouncedSearch = useDebouncedValue(search)

  const [editTarget, setEditTarget] = useState<SkillResponse | 'new' | null>(
    null,
  )
  const [form, setForm] = useState<SkillForm>({ name: '', categoryId: '' })
  const [deleteTarget, setDeleteTarget] = useState<SkillResponse | null>(null)

  const params: SkillsControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(categoryFilter !== '' ? { categoryId: categoryFilter } : {}),
  }

  const { data, isLoading, isError } = useSkillsControllerFindAll(params)
  const { data: categoriesData } = useSkillCategoriesControllerFindAll()
  const categories = categoriesData?.data ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/skills'] })

  const createMut = useSkillsControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useSkillsControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useSkillsControllerRemove({
    mutation: { onSuccess: invalidate },
  })
  const isMutating =
    createMut.isPending || updateMut.isPending || deleteMut.isPending

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  const openCreate = () => {
    setForm({ name: '', categoryId: categories[0]?.id ?? '' })
    setEditTarget('new')
  }
  const openEdit = (skill: SkillResponse) => {
    setForm({ name: skill.name, categoryId: skill.category.id })
    setEditTarget(skill)
  }
  const closeForm = () => setEditTarget(null)

  const submitForm = async () => {
    const name = form.name.trim()
    if (!name || form.categoryId === '') return
    const payload = { name, categoryId: form.categoryId }
    if (editTarget === 'new') {
      await createMut.mutateAsync({ data: payload })
    } else if (editTarget) {
      await updateMut.mutateAsync({ id: editTarget.id, data: payload })
    }
    closeForm()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMut.mutateAsync({ id: deleteTarget.id })
    setDeleteTarget(null)
  }

  const columns: Column<SkillResponse>[] = [
    { key: 'id', header: 'ID', render: (s) => s.id, className: 'w-20 text-muted' },
    { key: 'name', header: '이름', render: (s) => s.name },
    {
      key: 'category',
      header: '카테고리',
      render: (s) => s.category.name,
      className: 'text-foreground/70',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (skill) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={() => openEdit(skill)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setDeleteTarget(skill)}
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
        description="스킬 항목을 등록/수정/삭제합니다."
        actions={
          <Button
            variant="primary"
            onPress={openCreate}
            isDisabled={categories.length === 0}
          >
            스킬 추가
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input
          type="search"
          placeholder="이름으로 검색"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-xs"
        />
        <NativeSelect
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))
            setPage(1)
          }}
          className="max-w-[200px]"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <DataTable
        columns={columns}
        items={items}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="등록된 스킬이 없습니다."
      />

      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={editTarget !== null}
        onClose={closeForm}
        title={editTarget === 'new' ? '스킬 추가' : '스킬 수정'}
        footer={
          <>
            <Button variant="ghost" onPress={closeForm} isDisabled={isMutating}>
              취소
            </Button>
            <Button
              variant="primary"
              onPress={submitForm}
              isDisabled={
                isMutating || form.name.trim() === '' || form.categoryId === ''
              }
            >
              {isMutating ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="이름">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="스킬 이름"
            />
          </FormField>
          <FormField label="카테고리">
            <NativeSelect
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: Number(e.target.value) }))
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
        isOpen={deleteTarget !== null}
        title="스킬 삭제"
        message={`"${deleteTarget?.name}" 을(를) 삭제할까요? 되돌릴 수 없습니다.`}
        isPending={isMutating}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
