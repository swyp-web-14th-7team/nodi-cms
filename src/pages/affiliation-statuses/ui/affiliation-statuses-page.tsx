import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAffiliationStatusesControllerFindAll,
  useAffiliationStatusesControllerCreate,
  useAffiliationStatusesControllerUpdate,
  useAffiliationStatusesControllerDelete,
} from '../../../shared/api/endpoints/affiliation-statuses/affiliation-statuses'
import type { AffiliationStatusesControllerFindAllParams } from '../../../shared/api/model'
import { NameCrudManager } from '../../../shared/ui'
import { useDebouncedValue } from '../../../shared/lib'

const LIMIT = 10

export function AffiliationStatusesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const params: AffiliationStatusesControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } =
    useAffiliationStatusesControllerFindAll(params)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/affiliation-statuses'] })

  const createMut = useAffiliationStatusesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useAffiliationStatusesControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useAffiliationStatusesControllerDelete({
    mutation: { onSuccess: invalidate },
  })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  return (
    <NameCrudManager
      title="소속 상태"
      description="프로필 카드의 소속 상태(재직/구직 등)를 관리합니다."
      entityLabel="소속 상태"
      items={items}
      isLoading={isLoading}
      isError={isError}
      isMutating={
        createMut.isPending || updateMut.isPending || deleteMut.isPending
      }
      onCreate={(name) => createMut.mutateAsync({ data: { name } })}
      onUpdate={(id, name) =>
        updateMut.mutateAsync({ id: String(id), data: { name } })
      }
      onDelete={(id) => deleteMut.mutateAsync({ id: String(id) })}
      search={{
        value: search,
        onChange: (v) => {
          setSearch(v)
          setPage(1)
        },
      }}
      pagination={{ page, total, limit: LIMIT, onPageChange: setPage }}
    />
  )
}
