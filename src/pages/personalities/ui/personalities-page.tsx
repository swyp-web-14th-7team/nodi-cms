import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input, TextArea } from '@heroui/react'
import {
  usePersonalitiesControllerFindAll,
  usePersonalitiesControllerCreate,
  usePersonalitiesControllerUpdate,
  usePersonalitiesControllerDelete,
} from '../../../shared/api/endpoints/personalities/personalities'
import { useJobTypeControllerFindAll } from '../../../shared/api/endpoints/job-type/job-type'
import type {
  PersonalityResponse,
  PersonalitiesControllerFindAllParams,
  CreatePersonalityDto,
  JobTypeResponse,
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

interface PersonalityForm {
  name: string
  description: string
  jobTypeId: number | ''
  imageUrl: string
}

const emptyForm: PersonalityForm = {
  name: '',
  description: '',
  jobTypeId: '',
  imageUrl: '',
}

export function PersonalitiesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const [editTarget, setEditTarget] = useState<
    PersonalityResponse | 'new' | null
  >(null)
  const [form, setForm] = useState<PersonalityForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<PersonalityResponse | null>(
    null,
  )

  const params: PersonalitiesControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } = usePersonalitiesControllerFindAll(params)
  const { data: jobTypesData } = useJobTypeControllerFindAll({
    page: 1,
    limit: 100,
  })
  const jobTypes: JobTypeResponse[] = jobTypesData?.data.items ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/personalities'] })

  const createMut = usePersonalitiesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = usePersonalitiesControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = usePersonalitiesControllerDelete({
    mutation: { onSuccess: invalidate },
  })
  const isMutating =
    createMut.isPending || updateMut.isPending || deleteMut.isPending

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  const jobTypeName = (id: number | null) =>
    id === null ? '-' : (jobTypes.find((jt) => jt.id === id)?.name ?? `#${id}`)

  const openCreate = () => {
    setForm(emptyForm)
    setEditTarget('new')
  }
  const openEdit = (p: PersonalityResponse) => {
    setForm({
      name: p.name,
      description: p.description,
      jobTypeId: p.jobTypeId ?? '',
      imageUrl: p.imageUrl ?? '',
    })
    setEditTarget(p)
  }
  const closeForm = () => setEditTarget(null)

  const submitForm = async () => {
    const name = form.name.trim()
    const description = form.description.trim()
    if (!name || !description) return
    const payload: CreatePersonalityDto = {
      name,
      description,
      ...(form.jobTypeId !== '' ? { jobTypeId: form.jobTypeId } : {}),
      ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
    }
    if (editTarget === 'new') {
      await createMut.mutateAsync({ data: payload })
    } else if (editTarget) {
      await updateMut.mutateAsync({ id: String(editTarget.id), data: payload })
    }
    closeForm()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMut.mutateAsync({ id: String(deleteTarget.id) })
    setDeleteTarget(null)
  }

  const columns: Column<PersonalityResponse>[] = [
    { key: 'id', header: 'ID', render: (p) => p.id, className: 'w-16 text-muted' },
    { key: 'name', header: '이름', render: (p) => p.name },
    {
      key: 'description',
      header: '설명',
      render: (p) => (
        <span className="line-clamp-1 text-foreground/70">{p.description}</span>
      ),
    },
    {
      key: 'jobType',
      header: '직군',
      render: (p) => jobTypeName(p.jobTypeId),
      className: 'w-28 text-foreground/70',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (personality) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={() => openEdit(personality)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setDeleteTarget(personality)}
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
        title="성향"
        description="프로필 카드의 성향(퍼스널리티)을 관리합니다."
        actions={
          <Button variant="primary" onPress={openCreate}>
            성향 추가
          </Button>
        }
      />

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

      <DataTable
        columns={columns}
        items={items}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="등록된 성향이 없습니다."
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
        title={editTarget === 'new' ? '성향 추가' : '성향 수정'}
        footer={
          <>
            <Button variant="ghost" onPress={closeForm} isDisabled={isMutating}>
              취소
            </Button>
            <Button
              variant="primary"
              onPress={submitForm}
              isDisabled={
                isMutating ||
                form.name.trim() === '' ||
                form.description.trim() === ''
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
              placeholder="성향 이름"
            />
          </FormField>
          <FormField label="설명">
            <TextArea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="성향 설명"
              rows={3}
            />
          </FormField>
          <FormField label="직군 (선택)">
            <NativeSelect
              value={form.jobTypeId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  jobTypeId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            >
              <option value="">지정 안 함</option>
              {jobTypes.map((jt) => (
                <option key={jt.id} value={jt.id}>
                  {jt.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="이미지 URL (선택)">
            <Input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://…"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="성향 삭제"
        message={`"${deleteTarget?.name}" 을(를) 삭제할까요? 되돌릴 수 없습니다.`}
        isPending={isMutating}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
