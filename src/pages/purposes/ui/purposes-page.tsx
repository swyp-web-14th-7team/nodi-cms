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

// id 1 은 카드 기본값(공개) 목적이라 서버가 삭제를 막는다.
const DEFAULT_PURPOSE_ID = 1

export function PurposesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const searchTerm = debouncedSearch.trim()

  // 서버 기본 정렬이 sortOrder 오름차순이라 목록은 그대로 표시 순서다.
  const params: PurposesControllerFindAllParams = {
    page,
    limit: LIMIT,
    ...(searchTerm ? { search: searchTerm } : {}),
  }

  const { data, isLoading, isError } = usePurposesControllerFindAll(params)

  // 새 목적은 맨 뒤에 붙인다. 순서가 0 부터인지 1 부터인지에 기대지 않도록
  // 검색·페이지와 무관하게 현재 최대 sortOrder 만 1건 조회해 +1 한다.
  const { data: lastData } = usePurposesControllerFindAll({
    page: 1,
    limit: 1,
    sort: 'sortOrder',
    order: 'desc',
  })
  const maxSortOrder = lastData?.data.items?.[0]?.sortOrder
  const nextSortOrder = maxSortOrder === undefined ? 0 : maxSortOrder + 1

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

  // 검색 중에는 걸러진 목록이라 끌어다 놓은 자리가 실제 순서와 달라 막는다.
  const canReorder = !searchTerm

  return (
    <NameCrudManager
      title="목적"
      description="프로필 카드 사용 목적을 관리합니다. 순서는 서비스에 노출되는 표시 순서입니다."
      entityLabel="목적"
      items={items}
      isLoading={isLoading}
      isError={isError}
      isMutating={
        createMut.isPending || updateMut.isPending || deleteMut.isPending
      }
      onCreate={(name) =>
        createMut.mutateAsync({ data: { name, sortOrder: nextSortOrder } })
      }
      onUpdate={(id, name) => updateMut.mutateAsync({ id, data: { name } })}
      onDelete={(id) => deleteMut.mutateAsync({ id })}
      isDeletable={(item) => item.id !== DEFAULT_PURPOSE_ID}
      ordering={{
        isEnabled: canReorder,
        // 끌어다 놓은 자리의 sortOrder 를 그대로 주면 사이에 낀 목적들은 서버가 밀어준다.
        onReorder: (item, target) =>
          updateMut.mutateAsync({
            id: item.id,
            data: { sortOrder: target.sortOrder ?? 0 },
          }),
      }}
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
