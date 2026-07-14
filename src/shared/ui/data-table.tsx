import type { ReactNode } from 'react'

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
}

/** 목록 조회 결과를 그리는 공통 테이블. 로딩/에러/빈 상태를 함께 처리한다. */
export function DataTable<T>({
  columns,
  items,
  rowKey,
  isLoading,
  isError,
  emptyMessage = '데이터가 없습니다.',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-divider">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-divider bg-content2 text-left text-muted">
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
            items.map((item) => (
              <tr
                key={rowKey(item)}
                className="border-b border-divider last:border-b-0 hover:bg-content2/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-foreground ${col.className ?? ''}`}
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
