import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useInterestsControllerFindAll,
  useInterestsControllerCreate,
  useInterestsControllerUpdate,
  useInterestsControllerDelete,
} from '../../../shared/api/endpoints/interests/interests'
import type { InterestsControllerFindAllParams } from '../../../shared/api/model'
import { NameCrudManager } from '../../../shared/ui'
import { useDebouncedValue } from '../../../shared/lib'

const LIMIT = 10

export function InterestsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const params: InterestsControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data, isLoading, isError } = useInterestsControllerFindAll(params)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/interests'] })

  const createMut = useInterestsControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useInterestsControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useInterestsControllerDelete({
    mutation: { onSuccess: invalidate },
  })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  return (
    <NameCrudManager
      title="관심사"
      description="관심사 태그를 관리합니다."
      entityLabel="관심사"
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
