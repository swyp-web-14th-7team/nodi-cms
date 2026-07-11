/**
 * JWT payload 디코드 (서명 검증 없음).
 *
 * 서명 검증은 서버 책임이고, 프론트는 accessToken 안의 클레임(예: role)을
 * 읽어 UI 게이팅에만 쓴다. 그래서 payload 세그먼트만 base64url 디코드한다.
 * 위조된 토큰이 UI 를 통과하더라도 실제 API 는 서버가 재검증하므로 안전하다.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(
  token: string,
): T | null {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    )
    // UTF-8 안전 디코드
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
