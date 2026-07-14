import { useEffect, useState } from 'react'

/** 입력값(검색어 등)을 delay(ms) 만큼 지연시켜 반환한다. 서버 요청 폭주를 막는 용도. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
