import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  usePurposesControllerFindAll,
  usePurposesControllerCreate,
  usePurposesControllerUpdate,
  usePurposesControllerDelete,
} from '../../../shared/api/endpoints/purposes/purposes'
import type { PurposesControllerFindAllParams } from '../../../shared/api/model'
import { NameCrudManager } from '../../../shared/ui'
import { useDebouncedValue } from '../../../shared/lib'

const LIMIT = 10

export function PurposesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const params: PurposesControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } = usePurposesControllerFindAll(params)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/purposes'] })

  const createMut = usePurposesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = usePurposesControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = usePurposesControllerDelete({
    mutation: { onSuccess: invalidate },
  })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  return (
    <NameCrudManager
      title="목적"
      description="프로필 카드 사용 목적을 관리합니다."
      entityLabel="목적"
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
