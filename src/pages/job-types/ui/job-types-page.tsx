import { Fragment, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import {
  useJobTypeControllerFindAll,
  useJobTypeControllerCreate,
  useJobTypeControllerUpdate,
  useJobTypeControllerDelete,
} from '../../../shared/api/endpoints/job-type/job-type'
import { filesControllerUploadJobTypeImage } from '../../../shared/api/endpoints/files/files'
import type {
  JobTypeResponse,
  JobTypeControllerFindAllParams,
} from '../../../shared/api/model'
import {
  PageHeader,
  PaginationBar,
  ImageThumb,
  ImagePicker,
} from '../../../shared/ui'
import { useDebouncedValue, useUndoableDelete } from '../../../shared/lib'

const LIMIT = 10

interface JobTypeForm {
  name: string
  imageUrl: string
}
const emptyForm: JobTypeForm = { name: '', imageUrl: '' }

// null=닫힘, 'new'=추가, number=해당 id 수정
type EditorMode = 'new' | number | null

export function JobTypesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const params: JobTypeControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } = useJobTypeControllerFindAll(params)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/job-types'] })

  const createMut = useJobTypeControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useJobTypeControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useJobTypeControllerDelete({
    mutation: { onSuccess: invalidate },
  })
  const undo = useUndoableDelete<number>((id) =>
    deleteMut.mutateAsync({ id: String(id) }),
  )

  // 이미지 업로드. multipart FormData 구성과 봉투 타입 모두 orval 이 생성해준다.
  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const res = await filesControllerUploadJobTypeImage({ file })
      return res.data.url
    },
  })

  const items = undo.filterVisible(data?.data.items ?? [], (jt) => jt.id)
  const total = data?.data.metadata?.total ?? 0

  // ── 인라인 에디터 상태 ──
  const [mode, setMode] = useState<EditorMode>(null)
  const [form, setForm] = useState<JobTypeForm>(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setMode('new')
  }
  const openEdit = (jt: JobTypeResponse) => {
    setForm({ name: jt.name, imageUrl: jt.imageUrl ?? '' })
    setMode(jt.id)
  }
  const closeEditor = () => setMode(null)

  const isSaving = createMut.isPending || updateMut.isPending

  const onEditorKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') closeEditor()
  }

  const submit = async () => {
    const name = form.name.trim()
    if (!name) return
    const imageUrl = form.imageUrl.trim()

    if (mode === 'new') {
      // CreateJobTypeDto 에는 아직 imageUrl 이 없다(스펙 1.4.2). 이미지를 고른 채 추가하면
      // 생성 직후 PATCH 로 한 번 더 붙인다. create 가 imageUrl 을 받게 되면 이 단계는 없앤다.
      const created = await createMut.mutateAsync({ data: { name } })
      if (imageUrl)
        await updateMut.mutateAsync({
          id: String(created.data.id),
          data: { imageUrl },
        })
    } else if (typeof mode === 'number') {
      // imageUrl: null 이면 서버가 기존 이미지를 지운다.
      await updateMut.mutateAsync({
        id: String(mode),
        data: { name, imageUrl: imageUrl || null },
      })
    }
    closeEditor()
  }

  const canSubmit = !isSaving && !uploadMut.isPending && form.name.trim() !== ''

  // 편집 중인 행. 각 칸이 그 자리에서 입력으로 바뀐다(추가·수정 공용).
  const editableRow = (
    <tr className="border-b border-border last:border-b-0 bg-surface-secondary/30">
      <td className="px-4 py-2.5 text-muted">
        {typeof mode === 'number' ? mode : '—'}
      </td>
      <td className="px-4 py-2.5">
        <ImagePicker
          value={form.imageUrl}
          onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          onUpload={(file) => uploadMut.mutateAsync(file)}
          isUploading={uploadMut.isPending}
          isError={uploadMut.isError}
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onKeyDown={onEditorKeyDown}
          placeholder="직무 이름"
        />
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

  const colCount = 4

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="직무"
        description="직무 유형을 관리합니다."
        actions={
          <Button
            variant="primary"
            onPress={openAdd}
            isDisabled={mode === 'new'}
          >
            직무 추가
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
              <StateRow colSpan={colCount}>등록된 직무가 없습니다.</StateRow>
            ) : (
              items.map((jt) =>
                mode === jt.id ? (
                  <Fragment key={jt.id}>{editableRow}</Fragment>
                ) : (
                  <tr
                    key={jt.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50"
                  >
                    <td className="px-4 py-2.5 text-muted">{jt.id}</td>
                    <td className="px-4 py-2.5">
                      <ImageThumb url={jt.imageUrl} alt={jt.name} />
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{jt.name}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => openEdit(jt)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger-soft"
                          onPress={() => undo.request(jt.id, jt.name)}
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
