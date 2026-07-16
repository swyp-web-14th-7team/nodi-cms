import {
  Fragment,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
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
import { PageHeader, NativeSelect, PaginationBar } from '../../../shared/ui'
import { useDebouncedValue, useUndoableDelete } from '../../../shared/lib'

const LIMIT = 10

// 업로드 응답 url 은 base URL 이라 파일명을 붙여 접근한다.
// personality 업로드가 만드는 파생본은 origin.webp 와 36.webp 둘뿐이다
// (72/60/48 은 profile-image 쪽 파생본이라 여기엔 없다).
const imageSrc = (baseUrl: string) => `${baseUrl}/36.webp`

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

  // 이미지 업로드. multipart FormData 구성과 봉투 타입 모두 orval 이 생성해준다.
  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const res = await filesControllerUploadPersonalityImage({ file })
      return res.data
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
    e.target.value = '' // 같은 파일을 다시 고를 수 있게 비운다.
    if (!file) return
    try {
      const res = await uploadMut.mutateAsync(file)
      setForm((f) => ({ ...f, imageUrl: res.url }))
    } catch {
      // 실패는 uploadMut.isError 로 화면에 표시한다.
      // 여기서 삼키지 않으면 unhandled rejection 이 된다.
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending

  const onEditorKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') closeEditor()
  }

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

  const canSubmit =
    !isSaving &&
    !uploadMut.isPending &&
    form.name.trim() !== '' &&
    form.description.trim() !== ''

  // 편집 중인 행. 각 칸이 그 자리에서 입력으로 바뀐다(추가·수정 공용).
  // 행 높이를 유지하려고 설명도 TextArea 대신 한 줄 Input 을 쓴다.
  const editableRow = (
    <tr className="border-b border-border last:border-b-0 bg-surface-secondary/30">
      <td className="px-4 py-2.5 text-muted">
        {typeof mode === 'number' ? mode : '—'}
      </td>
      <td className="px-4 py-2.5">
        <div className="relative inline-block">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMut.isPending}
            title={form.imageUrl ? '이미지 변경' : '이미지 업로드'}
            className="block h-9 w-9 overflow-hidden rounded border border-border transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            {uploadMut.isPending ? (
              <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                …
              </span>
            ) : form.imageUrl ? (
              <img
                src={imageSrc(form.imageUrl)}
                alt="미리보기"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-surface-secondary text-xs text-muted">
                +
              </span>
            )}
          </button>
          {form.imageUrl && !uploadMut.isPending && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
              aria-label="이미지 제거"
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-secondary text-[10px] text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
          {uploadMut.isError && (
            <span className="ml-1 text-xs text-danger">실패</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onKeyDown={onEditorKeyDown}
          placeholder="성향 이름"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          onKeyDown={onEditorKeyDown}
          placeholder="성향 설명"
        />
      </td>
      <td className="px-4 py-2.5">
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
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="primary"
            onPress={submit}
            isDisabled={!canSubmit}
          >
            {isSaving ? '저장 중…' : '저장'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={closeEditor}
            isDisabled={isSaving}
          >
            취소
          </Button>
        </div>
      </td>
    </tr>
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

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary text-left text-muted">
              <th className="w-16 px-4 py-2.5 font-medium">ID</th>
              <th className="w-20 px-4 py-2.5 font-medium">이미지</th>
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">설명</th>
              <th className="w-28 px-4 py-2.5 font-medium">직군</th>
              <th className="w-40 px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {/* 추가: 목록 맨 위에 빈 편집 행을 얹는다 */}
            {mode === 'new' && editableRow}

            {isLoading ? (
              <StateRow colSpan={colCount}>불러오는 중…</StateRow>
            ) : isError ? (
              <StateRow colSpan={colCount}>
                데이터를 불러오지 못했습니다.
              </StateRow>
            ) : items.length === 0 && mode !== 'new' ? (
              <StateRow colSpan={colCount}>등록된 성향이 없습니다.</StateRow>
            ) : (
              items.map((p) =>
                mode === p.id ? (
                  <Fragment key={p.id}>{editableRow}</Fragment>
                ) : (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50"
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
                        <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-secondary text-xs text-muted">
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
