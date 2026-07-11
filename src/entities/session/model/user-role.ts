/**
 * 유저 권한. 백엔드 access JWT payload 의 `role` 값과 1:1 대응한다.
 *
 * 백엔드는 TS enum(USER = 0, ADMIN = 1)으로 정의하지만, 이 프로젝트는
 * tsconfig 의 `erasableSyntaxOnly: true` 때문에 TS `enum` 을 쓸 수 없다
 * (enum 은 런타임 코드를 emit 해서 erasable 하지 않음).
 * 그래서 동일하게 동작하는 const 객체 + 유니온 타입 패턴으로 대체한다.
 *
 * 사용법은 enum 과 동일: `UserRole.ADMIN`, 타입 자리엔 `UserRole`.
 */
export const UserRole = {
  USER: 0,
  ADMIN: 1,
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
