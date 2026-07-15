import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
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
import { PageHeader, FormField, NativeSelect, PaginationBar } from '../../../shared/ui'
import { useDebouncedValue, useUndoableDelete } from '../../../shared/lib'

const LIMIT = 10

// 업로드 응답 url 은 base URL 이라 크기 변형(`/72.webp` 등)을 붙여 접근한다. 36×36 엔 72.webp.
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

// null=닫힘, 'new'=추가, number=해당 id 수정
type EditorMode = 'new' | number | null

export function PersonalitiesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

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
  const undo = useUndoableDelete<number>((id) =>
    deleteMut.mutateAsync({ id: String(id) }),
  )

  // 이미지 업로드(멀티파트 FormData 직접 주입)
  const uploadMut = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return filesControllerUploadPersonalityImage({ data: form })
    },
  })

  const items = undo.filterVisible(data?.data.items ?? [], (p) => p.id)
  const total = data?.data.metadata?.total ?? 0
  const jobTypeName = (id: number | null) =>
    id === null ? '-' : (jobTypes.find((jt) => jt.id === id)?.name ?? `#${id}`)

  // ── 인라인 에디터 상태 ──
  const [mode, setMode] = useState<EditorMode>(null)
  const [form, setForm] = useState<PersonalityForm>(emptyForm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openAdd = () => {
    setForm(emptyForm)
    setMode('new')
  }
  const openEdit = (p: PersonalityResponse) => {
    setForm({
      name: p.name,
      description: p.description,
      jobTypeId: p.jobTypeId ?? '',
      imageUrl: p.imageUrl ?? '',
    })
    setMode(p.id)
  }
  const closeEditor = () => setMode(null)

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const res = await uploadMut.mutateAsync(file)
    setForm((f) => ({ ...f, imageUrl: res.url }))
  }

  const isSaving = createMut.isPending || updateMut.isPending
  const submit = async () => {
    const name = form.name.trim()
    const description = form.description.trim()
    if (!name || !description) return
    const payload: CreatePersonalityDto = {
      name,
      description,
      ...(form.jobTypeId !== '' ? { jobTypeId: form.jobTypeId } : {}),
      ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
    }
    if (mode === 'new') await createMut.mutateAsync({ data: payload })
    else if (typeof mode === 'number')
      await updateMut.mutateAsync({ id: String(mode), data: payload })
    closeEditor()
  }

  const editor = (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-content2/40 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="이름">
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="성향 이름"
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
      </div>
      <FormField label="설명">
        <TextArea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="성향 설명"
          rows={2}
        />
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
          {uploadMut.isError && (
            <span className="text-xs text-danger">업로드 실패</span>
          )}
        </div>
      </FormField>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onPress={closeEditor} isDisabled={isSaving}>
          취소
        </Button>
        <Button
          variant="primary"
          onPress={submit}
          isDisabled={
            isSaving ||
            uploadMut.isPending ||
            form.name.trim() === '' ||
            form.description.trim() === ''
          }
        >
          {isSaving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  )

  const colCount = 6

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="성향"
        description="프로필 카드의 성향(퍼스널리티)을 관리합니다."
        actions={
          <Button
            variant="primary"
            onPress={openAdd}
            isDisabled={mode === 'new'}
          >
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

      {/* 추가 인라인 에디터 */}
      {mode === 'new' && editor}

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-divider bg-content2 text-left text-muted">
              <th className="w-16 px-4 py-2.5 font-medium">ID</th>
              <th className="w-20 px-4 py-2.5 font-medium">이미지</th>
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">설명</th>
              <th className="w-28 px-4 py-2.5 font-medium">직군</th>
              <th className="w-40 px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <StateRow colSpan={colCount}>불러오는 중…</StateRow>
            ) : isError ? (
              <StateRow colSpan={colCount}>
                데이터를 불러오지 못했습니다.
              </StateRow>
            ) : items.length === 0 ? (
              <StateRow colSpan={colCount}>
                등록된 성향이 없습니다.
              </StateRow>
            ) : (
              items.map((p) =>
                mode === p.id ? (
                  <tr key={p.id} className="border-b border-divider last:border-b-0">
                    <td colSpan={colCount} className="p-3">
                      {editor}
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={p.id}
                    className="border-b border-divider last:border-b-0 hover:bg-content2/50"
                  >
                    <td className="px-4 py-2.5 text-muted">{p.id}</td>
                    <td className="px-4 py-2.5">
                      {p.imageUrl ? (
                        <img
                          src={imageSrc(p.imageUrl)}
                          alt={p.name}
                          className="h-9 w-9 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded bg-content2 text-xs text-muted">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="line-clamp-1 text-foreground/70">
                        {p.description}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/70">
                      {jobTypeName(p.jobTypeId)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => openEdit(p)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger-soft"
                          onPress={() => undo.request(p.id, p.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

function StateRow({
  colSpan,
  children,
}: {
  colSpan: number
  children: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-muted">
        {children}
      </td>
    </tr>
  )
}
