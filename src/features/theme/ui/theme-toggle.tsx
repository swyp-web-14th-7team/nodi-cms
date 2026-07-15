import { Switch } from '@heroui/react'
import { useThemeStore } from '../model/theme-store'

/**
 * 라이트/다크 테마 토글. HeroUI Switch 의 thumb 안에 아이콘을 넣어
 * 현재 테마(해=라이트 / 달=다크)를 손잡이가 그대로 보여준다.
 *
 * 색은 `.theme-switch` 클래스가 accent 계열 토큰을 덮어 무채색으로 만든다
 * (정의와 이유는 app/styles/index.css 참고).
 *
 * 라벨 대신 aria-label 만 두어 헤더에서 아이콘 스위치로만 보이게 한다.
 */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const isDark = theme === 'dark'

  return (
    <Switch.Root
      size="md"
      isSelected={isDark}
      onChange={(selected) => setTheme(selected ? 'dark' : 'light')}
      className="theme-switch"
      aria-label={
        isDark
          ? '다크 모드 (클릭해 라이트 모드로)'
          : '라이트 모드 (클릭해 다크 모드로)'
      }
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon>{isDark ? <MoonIcon /> : <SunIcon />}</Switch.Icon>
          </Switch.Thumb>
        </Switch.Control>
      </Switch.Content>
    </Switch.Root>
  )
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 1.5v3M12 19.5v3M22.5 12h-3M4.5 12h-3M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1M19.4 19.4l-2.1-2.1M6.7 6.7L4.6 4.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A9 9 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
