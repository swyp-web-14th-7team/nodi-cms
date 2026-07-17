import { create } from 'zustand'

/**
 * 화면 테마 전역 상태.
 *
 * - HeroUI/Tailwind 는 <html> 의 `dark` 클래스(또는 data-theme)로 테마를 가른다.
 *   → 상태를 바꿀 때마다 DOM 에 그대로 반영한다.
 * - 기본값은 시스템 설정(prefers-color-scheme)이다. 사용자가 토글을 누르는 순간
 *   그 선택이 localStorage 에 남아 시스템보다 우선한다. 인증 토큰과 달리
 *   민감정보가 아니라 저장해도 무방하다.
 * - 초기값은 index.html 의 인라인 스크립트가 이미 <html> 에 적용해둔 값을 읽는다
 *   (첫 페인트 전에 적용해야 테마가 번쩍이지 않는다).
 */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'nodi-cms.theme'

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

/** <html> 에 테마를 반영한다. index.html 인라인 스크립트와 동작이 같아야 한다. */
const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
}

/** 현재 <html> 상태에서 테마를 읽는다(인라인 스크립트가 세팅해둔 값). */
const readInitialTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

/** 사용자가 직접 고른 테마. 고른 적 없으면(=시스템을 따르는 중) null. */
const readStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    // localStorage 차단 환경 → 고른 적 없는 것으로 본다.
    return null
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage 차단 환경. 이번 세션 동안만 적용되고 유지는 포기한다.
    }
    set({ theme })
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))

// 아직 직접 고른 적 없으면 시스템 설정을 계속 따라간다(OS 가 밤에 다크로 바꾸면 같이 바뀐다).
// 토글을 한 번이라도 누르면 localStorage 에 값이 남아 여기서 걸러진다.
//
// ⚠️ setTheme 을 쓰면 안 된다. 저장까지 해버려서 "사용자가 고른 값"으로 둔갑하고,
// 그 순간부터 시스템을 안 따라가게 된다.
window.matchMedia(SYSTEM_DARK_QUERY).addEventListener('change', (e) => {
  if (readStoredTheme() !== null) return
  const theme: Theme = e.matches ? 'dark' : 'light'
  applyTheme(theme)
  useThemeStore.setState({ theme })
})
