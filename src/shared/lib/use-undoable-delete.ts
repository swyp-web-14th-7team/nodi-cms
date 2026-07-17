import { useCallback, useState } from 'react'
import { toast } from '@heroui/react'

const UNDO_TIMEOUT = 5000

type UndoRequestOptions = {
  /** 토스트 제목. 기본은 `"label" 삭제`. */
  title?: string
  /** 확정될 때 부를 동작. 기본은 훅에 넘긴 deleteFn. */
  commit?: () => Promise<unknown>
}

/**
 * "즉시 삭제 대신 되돌리기 토스트" 패턴.
 *
 * 삭제를 누르면 실제 API 호출을 바로 하지 않고, 해당 항목을 목록에서 낙관적으로 숨긴 뒤
 * HeroUI 토스트(취소 버튼 + 자동 사라짐)를 띄운다.
 * - 취소를 누르면 숨김을 풀어 원상복구(API 호출 없음).
 * - 토스트가 시간이 지나 닫히면 그때 실제 삭제 API 를 호출한다.
 *
 * 항목마다 지우는 방식이 달라질 수 있어(예: 스킬은 직군 연결만 끊기도 한다) request 에서
 * 동작과 문구를 갈아끼울 수 있다. 무엇을 할지는 누를 때 정해지고, 확정은 5초 뒤라
 * 그 사이 화면 상태가 바뀌어도 누를 때의 판단이 그대로 실행된다.
 *
 * @param deleteFn 기본 삭제 동작(보통 mutation 의 mutateAsync). 성공 시 목록 무효화까지 처리.
 */
export function useUndoableDelete<Id extends string | number>(
  deleteFn: (id: Id) => Promise<unknown>,
) {
  // 커밋 대기 중(화면에서 숨겨진) id 집합.
  const [pendingIds, setPendingIds] = useState<Set<Id>>(new Set())

  const unhide = useCallback((id: Id) => {
    setPendingIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const request = useCallback(
    (id: Id, label: string, options?: UndoRequestOptions) => {
      setPendingIds((prev) => new Set(prev).add(id))

      let undone = false
      const key = toast(options?.title ?? `"${label}" 삭제`, {
        description: '되돌리려면 취소를 누르세요.',
        timeout: UNDO_TIMEOUT,
        actionProps: {
          children: '취소',
          onPress: () => {
            undone = true
            unhide(id)
            toast.close(key)
          },
        },
        onClose: () => {
          if (undone) return
          // 토스트가 (자동/수동) 닫히면 실제 삭제 확정.
          // 성공하면 목록 무효화로 사라지고, 실패하면 숨김을 풀어 되살린다.
          const commit = options?.commit ?? (() => deleteFn(id))
          commit()
            .catch(() => {})
            .finally(() => unhide(id))
        },
      })
    },
    [deleteFn, unhide],
  )

  /** 목록에서 커밋 대기(숨김) 항목을 걸러낸다. */
  const filterVisible = useCallback(
    <T>(items: T[], getId: (item: T) => Id): T[] =>
      pendingIds.size === 0
        ? items
        : items.filter((item) => !pendingIds.has(getId(item))),
    [pendingIds],
  )

  return { request, filterVisible, isPending: (id: Id) => pendingIds.has(id) }
}
