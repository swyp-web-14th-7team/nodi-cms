import { useRef, type ChangeEvent } from 'react'

/**
 * 업로드 응답 url 은 uuid 까지의 base URL 이라 파일명을 붙여야 접근된다.
 * 성향·직무 업로드가 만드는 파생본은 origin.webp 와 36.webp 둘뿐이다
 * (72/60/48 은 profile-image 쪽 파생본이라 여기엔 없다).
 */
const imageThumbSrc = (baseUrl: string) => `${baseUrl}/36.webp`

/** 목록 행에 쓰는 36px 썸네일. 값이 없으면 빈 자리 표시만 남긴다. */
export function ImageThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url)
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-secondary text-xs text-muted">
        —
      </div>
    )
  return (
    <img
      src={imageThumbSrc(url)}
      alt={alt}
      className="h-9 w-9 rounded object-cover"
    />
  )
}

interface ImagePickerProps {
  /** 현재 이미지 base URL. 없으면 빈 문자열. */
  value: string
  onChange: (url: string) => void
  /** 파일을 올리고 base URL 을 돌려준다. */
  onUpload: (file: File) => Promise<string>
  isUploading: boolean
  isError: boolean
}

/**
 * 인라인 편집 행에서 쓰는 이미지 칸. 썸네일 자체가 파일 선택 버튼이고,
 * 값이 있으면 오른쪽 위 ✕ 로 지운다.
 */
export function ImagePicker({
  value,
  onChange,
  onUpload,
  isUploading,
  isError,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 고를 수 있게 비운다.
    if (!file) return
    try {
      onChange(await onUpload(file))
    } catch {
      // 실패는 isError 로 화면에 표시한다.
      // 여기서 삼키지 않으면 unhandled rejection 이 된다.
    }
  }

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title={value ? '이미지 변경' : '이미지 업로드'}
        className="block h-9 w-9 overflow-hidden rounded border border-border transition-opacity hover:opacity-70 disabled:opacity-50"
      >
        {isUploading ? (
          <span className="flex h-full w-full items-center justify-center text-xs text-muted">
            …
          </span>
        ) : value ? (
          <img
            src={imageThumbSrc(value)}
            alt="미리보기"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-surface-secondary text-xs text-muted">
            +
          </span>
        )}
      </button>
      {value && !isUploading && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="이미지 제거"
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-secondary text-[10px] text-muted hover:text-foreground"
        >
          ✕
        </button>
      )}
      {isError && <span className="ml-1 text-xs text-danger">실패</span>}
    </div>
  )
}
