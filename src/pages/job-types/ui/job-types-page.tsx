import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useJobTypeControllerFindAll,
  useJobTypeControllerCreate,
  useJobTypeControllerUpdate,
  useJobTypeControllerDelete,
} from '../../../shared/api/endpoints/job-type/job-type'
import type { JobTypeControllerFindAllParams } from '../../../shared/api/model'
import { NameCrudManager } from '../../../shared/ui'
import { useDebouncedValue } from '../../../shared/lib'

const LIMIT = 10

export function JobTypesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const params: JobTypeControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } = useJobTypeControllerFindAll(params)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/job-types'] })

  const createMut = useJobTypeControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useJobTypeControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useJobTypeControllerDelete({
    mutation: { onSuccess: invalidate },
  })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  return (
    <NameCrudManager
      title="직무"
      description="직무 유형을 관리합니다."
      entityLabel="직무"
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
