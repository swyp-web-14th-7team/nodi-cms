import { useState } from 'react'
import { Button, Input } from '@heroui/react'
import { PageHeader } from './page-header'
import { DataTable, type Column } from './data-table'
import { PaginationBar } from './pagination-bar'
import { useUndoableDelete } from '../lib'

export interface NameEntity {
  id: number
  name: string
  /** 표시 순서를 쓰는 엔티티(목적)만 값이 있다. */
  sortOrder?: number
}

interface NameCrudManagerProps {
  title: string
  description: string
  /** 이름 항목의 성격(예: "관심사"). 버튼/문구에 쓰인다. */
  entityLabel: string
  items: NameEntity[]
  isLoading: boolean
  isError: boolean
  isMutating: boolean
  onCreate: (name: string) => Promise<unknown>
  onUpdate: (id: number, name: string) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  /** 삭제할 수 없는 항목이 있으면 넘긴다. 없으면 전부 삭제 가능. */
  isDeletable?: (item: NameEntity) => boolean
  /**
   * 표시 순서를 관리하는 엔티티에서 넘긴다. 없으면 순서 열을 숨긴다.
   * 행 드래그 앤 드롭으로 옮기고, 사이 항목들의 재정렬은 서버가 처리한다.
   */
  ordering?: {
    /** 끌던 항목을 놓은 항목의 자리로 옮긴다. */
    onReorder: (item: NameEntity, target: NameEntity) => Promise<unknown>
    /** 검색 중처럼 순서를 바꾸면 안 될 때 끈다. */
    isEnabled: boolean
  }
  /** 검색 사용 시 넘긴다. 없으면 검색바를 숨긴다. */
  search?: {
    value: string
    onChange: (value: string) => void
  }
  /** 페이지네이션 사용 시 넘긴다. 없으면 숨긴다. */
  pagination?: {
    page: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
}

/**
 * `{ id, name }` 형태의 단순 엔티티(관심사·직무·목적·소속 상태)를 위한 공통 CRUD 화면.
 * 컨벤션: 모달을 쓰지 않는다.
 * - 추가: 상단 인라인 입력행에서 바로 생성
 * - 수정: 행의 이름이 인라인 입력으로 바뀌고 행별 저장/취소
 * - 삭제: 되돌리기 토스트(취소 가능·자동 확정)
 */
export function NameCrudManager({
  title,
  description,
  entityLabel,
  items,
  isLoading,
  isError,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
  isDeletable,
  ordering,
  search,
  pagination,
}: NameCrudManagerProps) {
  const [addName, setAddName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const undo = useUndoableDelete<number>(onDelete)
  const visibleItems = undo.filterVisible(items, (i) => i.id)

  const submitAdd = async () => {
    const name = addName.trim()
    if (!name) return
    await onCreate(name)
    setAddName('')
  }

  const startEdit = (item: NameEntity) => {
    setEditingId(item.id)
    setEditName(item.name)
  }
  const cancelEdit = () => setEditingId(null)
  const submitEdit = async () => {
    if (editingId === null) return
    const name = editName.trim()
    if (!name) return
    await onUpdate(editingId, name)
    setEditingId(null)
  }

  const columns: Column<NameEntity>[] = [
    // 순서 열은 ID 앞. 드래그 손잡이라 행의 맨 앞에 있어야 잡기 쉽다.
    ...(ordering
      ? [
          {
            key: 'sortOrder',
            header: '순서',
            className: 'w-20',
            render: (item: NameEntity) => (
              <div className="flex items-center gap-2 text-muted">
                <span
                  aria-hidden
                  className={`select-none ${
                    ordering.isEnabled ? 'cursor-grab' : 'opacity-30'
                  }`}
                  title="드래그해서 순서 변경"
                >
                  ⠿
                </span>
                <span>{item.sortOrder}</span>
              </div>
            ),
          },
        ]
      : []),
    { key: 'id', header: 'ID', render: (i) => i.id, className: 'w-20 text-muted' },
    {
      key: 'name',
      header: '이름',
      render: (item) =>
        editingId === item.id ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="max-w-xs"
          />
        ) : (
          item.name
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (item) =>
        editingId === item.id ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              onPress={submitEdit}
              isDisabled={isMutating || editName.trim() === ''}
            >
              저장
            </Button>
            <Button size="sm" variant="ghost" onPress={cancelEdit}>
              취소
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onPress={() => startEdit(item)}>
              수정
            </Button>
            {(isDeletable?.(item) ?? true) && (
              <Button
                size="sm"
                variant="danger-soft"
                onPress={() => undo.request(item.id, item.name)}
              >
                삭제
              </Button>
            )}
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} description={description} />

      {search && (
        <Input
          type="search"
          placeholder="이름으로 검색"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className="max-w-xs"
        />
      )}

      {/* 인라인 추가 */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary/50 p-2">
        <Input
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          placeholder={`새 ${entityLabel} 이름`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitAdd()
          }}
          className="max-w-xs"
        />
        <Button
          variant="primary"
          onPress={submitAdd}
          isDisabled={isMutating || addName.trim() === ''}
        >
          추가
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={visibleItems}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={`등록된 ${entityLabel}이(가) 없습니다.`}
        rowDrag={
          ordering
            ? {
                // 이름 편집 중에는 입력 드래그와 겹치므로 끈다.
                isEnabled: ordering.isEnabled && editingId === null,
                onDrop: (from, to) => {
                  ordering.onReorder(from, to)
                },
              }
            : undefined
        }
      />

      {pagination && pagination.total > 0 && (
        <PaginationBar
          page={pagination.page}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
