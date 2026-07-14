import { Button } from '@heroui/react'

interface PaginationBarProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

/** 목록 하단 페이지네이션. total/limit 으로 전체 페이지 수를 계산한다. */
export function PaginationBar({
  page,
  total,
  limit,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="flex items-center justify-between text-sm text-muted">
      <span>
        전체 {total.toLocaleString()}건 · {page} / {totalPages} 페이지
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          isDisabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
        >
          이전
        </Button>
        <Button
          size="sm"
          variant="ghost"
          isDisabled={page >= totalPages}
          onPress={() => onPageChange(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
