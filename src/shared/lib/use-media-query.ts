import { useCallback, useSyncExternalStore } from 'react'

/**
 * CSS 미디어 쿼리 매칭 여부를 구독한다. 화면 폭이 바뀌면 리렌더된다.
 *
 * 예) const isNarrow = useMediaQuery('(max-width: 1023px)')
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
