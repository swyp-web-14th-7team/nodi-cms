import { useState } from 'react'
import { Button, Input } from '@heroui/react'
import { PageHeader } from './page-header'
import { DataTable, type Column } from './data-table'
import { Modal } from './modal'
import { ConfirmDialog } from './confirm-dialog'
import { FormField } from './form-field'
import { PaginationBar } from './pagination-bar'

export interface NameEntity {
  id: number
  name: string
}

interface NameCrudManagerProps {
  title: string
  description: string
  /** 이름 항목의 성격(예: "관심사"). 버튼/모달 문구에 쓰인다. */
  entityLabel: string
  items: NameEntity[]
  isLoading: boolean
  isError: boolean
  isMutating: boolean
  onCreate: (name: string) => Promise<unknown>
  onUpdate: (id: number, name: string) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
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
 * `{ id, name }` 형태의 단순 엔티티(관심사·직무·스킬 카테고리)를 위한 공통 CRUD 화면.
 * 목록/검색/페이지네이션 + 생성·수정 모달 + 삭제 확인을 한 컴포넌트로 처리한다.
 * API 호출은 상위(page)에서 주입한 콜백으로만 이뤄져 이 컴포넌트는 도메인을 모른다.
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
  search,
  pagination,
}: NameCrudManagerProps) {
  const [editTarget, setEditTarget] = useState<NameEntity | 'new' | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NameEntity | null>(null)

  const openCreate = () => {
    setNameInput('')
    setEditTarget('new')
  }
  const openEdit = (item: NameEntity) => {
    setNameInput(item.name)
    setEditTarget(item)
  }
  const closeForm = () => setEditTarget(null)

  const submitForm = async () => {
    const name = nameInput.trim()
    if (!name) return
    if (editTarget === 'new') {
      await onCreate(name)
    } else if (editTarget) {
      await onUpdate(editTarget.id, name)
    }
    closeForm()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<NameEntity>[] = [
    { key: 'id', header: 'ID', render: (i) => i.id, className: 'w-20 text-muted' },
    { key: 'name', header: '이름', render: (i) => i.name },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={() => openEdit(item)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setDeleteTarget(item)}
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
        title={title}
        description={description}
        actions={
          <Button variant="primary" onPress={openCreate}>
            {entityLabel} 추가
          </Button>
        }
      />

      {search && (
        <Input
          type="search"
          placeholder="이름으로 검색"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className="max-w-xs"
        />
      )}

      <DataTable
        columns={columns}
        items={items}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={`등록된 ${entityLabel}이(가) 없습니다.`}
      />

      {pagination && pagination.total > 0 && (
        <PaginationBar
          page={pagination.page}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
        />
      )}

      <Modal
        isOpen={editTarget !== null}
        onClose={closeForm}
        title={editTarget === 'new' ? `${entityLabel} 추가` : `${entityLabel} 수정`}
        footer={
          <>
            <Button variant="ghost" onPress={closeForm} isDisabled={isMutating}>
              취소
            </Button>
            <Button
              variant="primary"
              onPress={submitForm}
              isDisabled={isMutating || nameInput.trim().length === 0}
            >
              {isMutating ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        <FormField label="이름">
          <Input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={`${entityLabel} 이름`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitForm()
            }}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`${entityLabel} 삭제`}
        message={`"${deleteTarget?.name}" 을(를) 삭제할까요? 되돌릴 수 없습니다.`}
        isPending={isMutating}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
