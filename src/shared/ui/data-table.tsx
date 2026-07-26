import { useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (item: T) => ReactNode
  /** 셀/헤더에 붙일 추가 클래스(정렬 등). */
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  items: T[]
  rowKey: (item: T) => string | number
  isLoading?: boolean
  isError?: boolean
  emptyMessage?: string
  /** 행을 드래그해 순서를 바꿀 때 넘긴다. 없으면 드래그하지 않는다. */
  rowDrag?: {
    isEnabled: boolean
    /** 끌던 행(from)을 놓은 행(to) 자리로 옮긴다. */
    onDrop: (from: T, to: T) => void
  }
}

/** 목록 조회 결과를 그리는 공통 테이블. 로딩/에러/빈 상태를 함께 처리한다. */
export function DataTable<T>({
  columns,
  items,
  rowKey,
  isLoading,
  isError,
  emptyMessage = '데이터가 없습니다.',
  rowDrag,
}: DataTableProps<T>) {
  // 드래그 중인 행과 현재 올라가 있는 행의 인덱스. 놓는 위치를 선으로 표시한다.
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const isDragging = dragIndex !== null

  const endDrag = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  // 놓을 자리 표시: 아래로 끌면 대상 행의 아래쪽, 위로 끌면 위쪽에 선을 긋는다.
  const dropLineClass = (index: number) => {
    if (!isDragging || overIndex !== index || dragIndex === index) return ''
    return dragIndex < index
      ? 'shadow-[inset_0_-2px_0_0_var(--foreground)]'
      : 'shadow-[inset_0_2px_0_0_var(--foreground)]'
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-secondary text-left text-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 font-medium ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <StateRow colSpan={columns.length}>불러오는 중…</StateRow>
          ) : isError ? (
            <StateRow colSpan={columns.length}>
              데이터를 불러오지 못했습니다.
            </StateRow>
          ) : items.length === 0 ? (
            <StateRow colSpan={columns.length}>{emptyMessage}</StateRow>
          ) : (
            items.map((item, index) => (
              <tr
                key={rowKey(item)}
                draggable={rowDrag?.isEnabled}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={endDrag}
                onDragOver={(e) => {
                  if (!isDragging) return
                  e.preventDefault()
                  setOverIndex(index)
                }}
                onDrop={(e) => {
                  if (!isDragging) return
                  e.preventDefault()
                  if (dragIndex !== index) {
                    rowDrag?.onDrop(items[dragIndex], item)
                  }
                  endDrag()
                }}
                className={`border-b border-border last:border-b-0 hover:bg-surface-secondary/50 ${
                  rowDrag?.isEnabled ? 'cursor-grab' : ''
                } ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-foreground ${col.className ?? ''} ${dropLineClass(index)}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
