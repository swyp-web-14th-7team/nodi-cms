import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  interestsControllerFindAll,
  useInterestsControllerCreate,
  useInterestsControllerUpdate,
  useInterestsControllerDelete,
} from '../../../shared/api/endpoints/interests/interests'
import type { InterestResponse } from '../../../shared/api/model'
import { TagChip, TagInput, PillButton } from '../../../shared/ui'
import { useUndoableDelete } from '../../../shared/lib'

// 서버가 허용하는 limit 상한(스펙상 최대 100).
const INTEREST_PAGE_SIZE = 100

/**
 * 관심사를 마지막 페이지까지 훑어 모은다.
 * 스킬과 달리 카테고리가 없어 한 판에 펼치므로 나눠 담을 기준이 없다.
 */
const fetchAllInterests = async (signal?: AbortSignal) => {
  const items: InterestResponse[] = []
  for (let page = 1; ; page += 1) {
    const res = await interestsControllerFindAll(
      { page, limit: INTEREST_PAGE_SIZE },
      undefined,
      signal,
    )
    const pageItems = res.data.items ?? []
    items.push(...pageItems)
    const total = res.data.metadata?.total ?? items.length
    if (pageItems.length === 0 || items.length >= total) break
  }
  return items
}

export function InterestsPage() {
  const queryClient = useQueryClient()

  const {
    data: allInterests = [],
    isLoading,
    isError,
  } = useQuery({
    // '/interests' 프리픽스 유지 → invalidateQueries(['/interests']) 가 그대로 적중한다.
    queryKey: ['/interests', { all: true }],
    queryFn: ({ signal }) => fetchAllInterests(signal),
  })

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
  const undo = useUndoableDelete<number>((id) =>
    deleteMut.mutateAsync({ id: String(id) }),
  )

  const interests = undo.filterVisible(allInterests, (i) => i.id)

  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const submitAdd = async () => {
    const name = addName.trim()
    if (!name) return
    await createMut.mutateAsync({ data: { name } })
    setAddName('') // 연속 입력을 위해 열어둔 채 비운다.
  }
  const submitEdit = async () => {
    if (editingId === null) return
    const name = editName.trim()
    if (!name) return
    await updateMut.mutateAsync({ id: String(editingId), data: { name } })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">
          관심분야 태그 관리
        </h1>
      </div>

      {isError && (
        <p className="text-sm text-danger">
          목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {!isError && isLoading && (
        <p className="text-sm text-muted">불러오는 중…</p>
      )}

      {!isError && !isLoading && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {interests.map((interest) =>
              editingId === interest.id ? (
                <TagInput
                  key={interest.id}
                  value={editName}
                  onChange={setEditName}
                  onEnter={submitEdit}
                  onEscape={() => setEditingId(null)}
                />
              ) : (
                <TagChip
                  key={interest.id}
                  label={interest.name}
                  onEdit={() => {
                    setEditingId(interest.id)
                    setEditName(interest.name)
                  }}
                  onDelete={() => undo.request(interest.id, interest.name)}
                />
              ),
            )}

            {adding && (
              <TagInput
                value={addName}
                onChange={setAddName}
                placeholder="새 관심분야"
                onEnter={submitAdd}
                onEscape={() => setAdding(false)}
              />
            )}
          </div>

          {interests.length === 0 && !adding && (
            <p className="text-sm text-muted">
              관심분야가 없습니다. "추가하기"로 먼저 만들어 주세요.
            </p>
          )}

          <div className="flex justify-end">
            <PillButton onClick={() => setAdding(true)} icon="+">
              추가하기
            </PillButton>
          </div>
          <div className="border-t border-divider" />
        </section>
      )}
    </div>
  )
}
