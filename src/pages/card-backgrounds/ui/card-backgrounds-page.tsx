import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import {
  useCardBackgroundImagesControllerFindAll,
  useCardBackgroundImagesControllerCreate,
  useCardBackgroundImagesControllerDelete,
} from '../../../shared/api/endpoints/card-background-images/card-background-images'
import { filesControllerUploadCardBackgroundImage } from '../../../shared/api/endpoints/files/files'
import type {
  CardBackgroundImageResponse,
  CardBackgroundImagesControllerFindAllParams,
} from '../../../shared/api/model'
import { PageHeader, PaginationBar } from '../../../shared/ui'
import { useUndoableDelete } from '../../../shared/lib'

const LIMIT = 12

// base URL 뒤에 파생본 파일명을 붙여 접근한다. 카드 표시용은 282x400.webp.
const imageSrc = (baseUrl: string) => `${baseUrl}/282x400.webp`

export function CardBackgroundsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const params: CardBackgroundImagesControllerFindAllParams = {
    page,
    limit: LIMIT,
  }
  const { data, isLoading, isError } =
    useCardBackgroundImagesControllerFindAll(params)

  const total = data?.data.metadata?.total ?? 0

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/card-background-images'] })

  const createMut = useCardBackgroundImagesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useCardBackgroundImagesControllerDelete({
    mutation: { onSuccess: invalidate },
  })
  // 삭제는 즉시 지우지 않고 되돌리기 토스트로 확정한다.
  const undo = useUndoableDelete<number>((id) => deleteMut.mutateAsync({ id }))

  // 삭제 대기 중인 항목은 화면에서 낙관적으로 숨긴다.
  const allImages: CardBackgroundImageResponse[] = data?.data.items ?? []
  const images = undo.filterVisible(allImages, (img) => img.id)

  // 업로드 → base URL 획득(아직 등록 전). 등록은 별도 버튼으로 확정한다.
  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const res = await filesControllerUploadCardBackgroundImage({ file })
      return res.data
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  // URL 복사 후 잠깐 "복사됨" 을 보여준다.
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const copyUrl = async (id: number, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      window.setTimeout(
        () => setCopiedId((c) => (c === id ? null : c)),
        1500,
      )
    } catch {
      // 클립보드 접근이 막힌 환경이면 조용히 무시한다.
    }
  }

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 고를 수 있게 비운다.
    if (!file) return
    try {
      const res = await uploadMut.mutateAsync(file)
      setPendingUrl(res.url)
    } catch {
      // 실패는 uploadMut.isError 로 표시한다.
    }
  }

  const register = async () => {
    if (!pendingUrl) return
    await createMut.mutateAsync({ data: { imageUrl: pendingUrl } })
    setPendingUrl(null)
    setPage(1)
  }

  const cancelPending = () => {
    setPendingUrl(null)
    uploadMut.reset()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="카드 배경"
        description="프로필 카드에서 선택할 수 있는 배경 이미지를 관리합니다."
      />

      {/* 추가 영역: 업로드 → 미리보기 → 등록 */}
      <div className="rounded-lg border border-border p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onPickImage}
          className="hidden"
        />
        {pendingUrl ? (
          <div className="flex items-center gap-4">
            <img
              src={imageSrc(pendingUrl)}
              alt="등록할 배경 미리보기"
              className="h-40 w-[7.05rem] rounded-md border border-border object-cover"
            />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground">
                업로드가 완료되었습니다. 배경 선택지로 등록할까요?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onPress={register}
                  isDisabled={createMut.isPending}
                >
                  {createMut.isPending ? '등록 중…' : '등록'}
                </Button>
                <Button
                  variant="ghost"
                  onPress={cancelPending}
                  isDisabled={createMut.isPending}
                >
                  취소
                </Button>
              </div>
              {createMut.isError && (
                <span className="text-xs text-danger">
                  등록에 실패했습니다. 다시 시도해 주세요.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onPress={() => fileInputRef.current?.click()}
              isDisabled={uploadMut.isPending}
            >
              {uploadMut.isPending ? '업로드 중…' : '+ 이미지 업로드'}
            </Button>
            <span className="text-xs text-muted">
              png·jpg·webp, 최대 5MB. 업로드 후 등록을 확정합니다.
            </span>
            {uploadMut.isError && (
              <span className="text-xs text-danger">
                업로드에 실패했습니다.
              </span>
            )}
          </div>
        )}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <p className="py-10 text-center text-muted">불러오는 중…</p>
      ) : isError ? (
        <p className="py-10 text-center text-muted">
          데이터를 불러오지 못했습니다.
        </p>
      ) : images.length === 0 ? (
        <p className="py-10 text-center text-muted">
          등록된 배경 이미지가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              <img
                src={imageSrc(img.imageUrl)}
                alt={`카드 배경 #${img.id}`}
                className="aspect-[282/400] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => undo.request(img.id, `배경 #${img.id}`)}
                aria-label={`배경 #${img.id} 삭제`}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-sm text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100 focus-visible:opacity-100"
              >
                ✕
              </button>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span className="shrink-0 text-xs font-medium text-muted">
                  #{img.id}
                </span>
                <span
                  title={img.imageUrl}
                  className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/60"
                >
                  {img.imageUrl}
                </span>
                <button
                  type="button"
                  onClick={() => copyUrl(img.id, img.imageUrl)}
                  aria-label="URL 복사"
                  title="URL 복사"
                  className="shrink-0 rounded px-1 text-[11px] text-muted transition-colors hover:text-foreground"
                >
                  {copiedId === img.id ? '복사됨' : '복사'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
