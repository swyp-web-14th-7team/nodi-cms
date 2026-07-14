import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Chip, Input } from '@heroui/react'
import {
  useProfileCardTemplatesControllerFindAll,
  useProfileCardTemplatesControllerCreate,
  useProfileCardTemplatesControllerDelete,
} from '../../../shared/api/endpoints/profile-card-templates/profile-card-templates'
import { useJobTypeControllerFindAll } from '../../../shared/api/endpoints/job-type/job-type'
import type {
  ProfileCardTemplateResponse,
  TemplateItemDto,
} from '../../../shared/api/model'
import {
  PageHeader,
  DataTable,
  Modal,
  ConfirmDialog,
  FormField,
  NativeSelect,
  PaginationBar,
  type Column,
} from '../../../shared/ui'

const LIMIT = 10

const ITEM_TYPE_LABELS = ['짧은 텍스트', '긴 텍스트', '링크', '숫자']

function emptyItem(): TemplateItemDto {
  return { label: '', description: '', type: 0 }
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [detailTarget, setDetailTarget] =
    useState<ProfileCardTemplateResponse | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<ProfileCardTemplateResponse | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError } =
    useProfileCardTemplatesControllerFindAll({ page, limit: LIMIT })
  const { data: jobTypesData } = useJobTypeControllerFindAll({
    page: 1,
    limit: 100,
  })
  const jobTypes = jobTypesData?.data.items ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/profile-card-templates'] })

  const createMut = useProfileCardTemplatesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useProfileCardTemplatesControllerDelete({
    mutation: { onSuccess: invalidate },
  })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMut.mutateAsync({ id: deleteTarget.id })
    setDeleteTarget(null)
  }

  const columns: Column<ProfileCardTemplateResponse>[] = [
    { key: 'id', header: 'ID', render: (t) => t.id, className: 'w-16 text-muted' },
    { key: 'jobType', header: '직군', render: (t) => t.jobType.name },
    {
      key: 'version',
      header: '버전',
      render: (t) => `v${t.version}`,
      className: 'w-20 text-foreground/70',
    },
    {
      key: 'active',
      header: '활성',
      className: 'w-20',
      render: (t) =>
        t.isActive ? (
          <Chip size="sm" color="success">
            활성
          </Chip>
        ) : (
          <Chip size="sm" color="default">
            비활성
          </Chip>
        ),
    },
    {
      key: 'items',
      header: '항목 수',
      render: (t) => `${t.items.length}개`,
      className: 'w-24 text-foreground/70',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      render: (template) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setDetailTarget(template)}
          >
            상세
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setDeleteTarget(template)}
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
        title="프로필 카드 템플릿"
        description="직군별 프로필 카드 템플릿을 관리합니다."
        actions={
          <Button
            variant="primary"
            onPress={() => setCreateOpen(true)}
            isDisabled={jobTypes.length === 0}
          >
            템플릿 추가
          </Button>
        }
      />

      <DataTable
        columns={columns}
        items={items}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="등록된 템플릿이 없습니다."
      />

      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      {/* 상세 */}
      <Modal
        isOpen={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        title={
          detailTarget
            ? `${detailTarget.jobType.name} 템플릿 v${detailTarget.version}`
            : '템플릿 상세'
        }
      >
        <div className="flex flex-col gap-2">
          {detailTarget?.items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-divider px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                <Chip size="sm" variant="secondary">
                  {ITEM_TYPE_LABELS[item.type] ?? '기타'}
                </Chip>
              </div>
              {item.description && (
                <p className="mt-1 text-muted">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* 생성 */}
      <TemplateCreateModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        jobTypes={jobTypes}
        isPending={createMut.isPending}
        onSubmit={async (jobTypeId, templateItems) => {
          await createMut.mutateAsync({
            data: { jobTypeId, items: templateItems },
          })
          setCreateOpen(false)
        }}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="템플릿 삭제"
        message={`"${deleteTarget?.jobType.name}" 템플릿(v${deleteTarget?.version})을 삭제할까요?`}
        isPending={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function TemplateCreateModal({
  isOpen,
  onClose,
  jobTypes,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  jobTypes: { id: number; name: string }[]
  isPending: boolean
  onSubmit: (jobTypeId: number, items: TemplateItemDto[]) => Promise<void>
}) {
  const [jobTypeId, setJobTypeId] = useState<number | ''>('')
  const [items, setItems] = useState<TemplateItemDto[]>([emptyItem()])

  // 모달을 열 때마다 초기화한다.
  const resetAndClose = () => {
    setJobTypeId('')
    setItems([emptyItem()])
    onClose()
  }

  const effectiveJobTypeId = jobTypeId === '' ? jobTypes[0]?.id : jobTypeId

  const updateItem = (idx: number, patch: Partial<TemplateItemDto>) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    )

  const isValid =
    effectiveJobTypeId !== undefined &&
    items.length > 0 &&
    items.every((it) => it.label.trim() !== '')

  const submit = async () => {
    if (!isValid || effectiveJobTypeId === undefined) return
    await onSubmit(
      effectiveJobTypeId,
      items.map((it) => ({ ...it, label: it.label.trim() })),
    )
    setJobTypeId('')
    setItems([emptyItem()])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="템플릿 추가"
      footer={
        <>
          <Button variant="ghost" onPress={resetAndClose} isDisabled={isPending}>
            취소
          </Button>
          <Button
            variant="primary"
            onPress={submit}
            isDisabled={isPending || !isValid}
          >
            {isPending ? '저장 중…' : '저장'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="직군">
          <NativeSelect
            value={effectiveJobTypeId ?? ''}
            onChange={(e) => setJobTypeId(Number(e.target.value))}
          >
            {jobTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">항목</span>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setItems((prev) => [...prev, emptyItem()])}
            >
              항목 추가
            </Button>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 rounded-md border border-divider p-3"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="라벨"
                  value={item.label}
                  onChange={(e) => updateItem(idx, { label: e.target.value })}
                  className="flex-1"
                />
                <NativeSelect
                  value={item.type}
                  onChange={(e) =>
                    updateItem(idx, { type: Number(e.target.value) })
                  }
                  className="w-32"
                >
                  {ITEM_TYPE_LABELS.map((label, typeValue) => (
                    <option key={typeValue} value={typeValue}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Input
                placeholder="설명 (선택)"
                value={item.description}
                onChange={(e) =>
                  updateItem(idx, { description: e.target.value })
                }
              />
              {items.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="danger-soft"
                    onPress={() =>
                      setItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    항목 삭제
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
