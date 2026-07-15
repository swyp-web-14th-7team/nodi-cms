import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, TextArea } from '@heroui/react'
import {
  usePersonalitiesControllerFindAll,
  usePersonalitiesControllerCreate,
  usePersonalitiesControllerUpdate,
  usePersonalitiesControllerDelete,
} from '../../../shared/api/endpoints/personalities/personalities'
import { filesControllerUploadPersonalityImage } from '../../../shared/api/endpoints/files/files'
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

// 업로드 응답 url 은 base URL 이라 크기 변형(`/72.webp` 등)을 붙여 접근한다.
// 36×36 표시에는 2x 인 72.webp 를 쓴다.
const imageSrc = (baseUrl: string) => `${baseUrl}/72.webp`

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

  // 이미지 업로드: 스펙에 body 가 없어 orval 이 인자를 안 만들어주므로
  // customInstance 옵션으로 multipart FormData 를 직접 주입한다.
  const uploadMut = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return filesControllerUploadPersonalityImage({ data: form })
    },
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 허용
    if (!file) return
    const res = await uploadMut.mutateAsync(file)
    setForm((f) => ({ ...f, imageUrl: res.url }))
  }

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
    {
      key: 'image',
      header: '이미지',
      className: 'w-20',
      render: (p) =>
        p.imageUrl ? (
          <img
            src={imageSrc(p.imageUrl)}
            alt={p.name}
            className="h-9 w-9 rounded object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded bg-content2 text-xs text-muted">
            —
          </div>
        ),
    },
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
                uploadMut.isPending ||
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
          <FormField label="이미지 (선택)">
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <img
                  src={imageSrc(form.imageUrl)}
                  alt="미리보기"
                  className="h-9 w-9 rounded object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded bg-content2 text-xs text-muted">
                  —
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="hidden"
              />
              <Button
                size="sm"
                variant="secondary"
                isDisabled={uploadMut.isPending}
                onPress={() => fileInputRef.current?.click()}
              >
                {uploadMut.isPending
                  ? '업로드 중…'
                  : form.imageUrl
                    ? '이미지 변경'
                    : '이미지 업로드'}
              </Button>
              {form.imageUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={uploadMut.isPending}
                  onPress={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                >
                  제거
                </Button>
              )}
            </div>
            {uploadMut.isError && (
              <span className="text-xs text-danger">
                업로드에 실패했습니다. 다시 시도해 주세요.
              </span>
            )}
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
