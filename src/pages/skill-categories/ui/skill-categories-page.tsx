import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useSkillCategoriesControllerFindAll,
  useSkillCategoriesControllerCreate,
  useSkillCategoriesControllerUpdate,
  useSkillCategoriesControllerRemove,
} from '../../../shared/api/endpoints/skill-categories/skill-categories'
import { NameCrudManager } from '../../../shared/ui'

export function SkillCategoriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useSkillCategoriesControllerFindAll()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/skill-categories'] })

  const createMut = useSkillCategoriesControllerCreate({
    mutation: { onSuccess: invalidate },
  })
  const updateMut = useSkillCategoriesControllerUpdate({
    mutation: { onSuccess: invalidate },
  })
  const deleteMut = useSkillCategoriesControllerRemove({
    mutation: { onSuccess: invalidate },
  })

  // 이 엔드포인트는 서버 검색/페이지네이션이 없어 클라이언트에서 필터링한다.
  const items = useMemo(() => {
    const all = data?.data ?? []
    const keyword = search.trim().toLowerCase()
    return keyword
      ? all.filter((c) => c.name.toLowerCase().includes(keyword))
      : all
  }, [data, search])

  return (
    <NameCrudManager
      title="스킬 카테고리"
      description="스킬을 묶는 카테고리를 관리합니다."
      entityLabel="카테고리"
      items={items}
      isLoading={isLoading}
      isError={isError}
      isMutating={
        createMut.isPending || updateMut.isPending || deleteMut.isPending
      }
      onCreate={(name) => createMut.mutateAsync({ data: { name } })}
      onUpdate={(id, name) => updateMut.mutateAsync({ id, data: { name } })}
      onDelete={(id) => deleteMut.mutateAsync({ id })}
      search={{ value: search, onChange: setSearch }}
    />
  )
}
