import { create } from 'zustand'

/**
 * 화면 테마 전역 상태.
 *
 * - HeroUI/Tailwind 는 <html> 의 `dark` 클래스(또는 data-theme)로 테마를 가른다.
 *   → 상태를 바꿀 때마다 DOM 에 그대로 반영한다.
 * - 선택값은 localStorage 에 남겨 새로고침해도 유지한다. 인증 토큰과 달리
 *   민감정보가 아니라 저장해도 무방하다.
 * - 초기값은 index.html 의 인라인 스크립트가 이미 <html> 에 적용해둔 값을 읽는다
 *   (첫 페인트 전에 적용해야 테마가 번쩍이지 않는다).
 */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'nodi-cms.theme'

/** <html> 에 테마를 반영한다. index.html 인라인 스크립트와 동작이 같아야 한다. */
const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
}

/** 현재 <html> 상태에서 테마를 읽는다(인라인 스크립트가 세팅해둔 값). */
const readInitialTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    set({ theme })
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))
