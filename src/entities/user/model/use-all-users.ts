import { useQueries } from '@tanstack/react-query'
import {
  useUsersControllerGetAllUsers,
  getUsersControllerGetAllUsersQueryOptions,
} from '../../../shared/api/endpoints/users/users'
import type { UserResponse } from '../../../shared/api/model'

// GET /users 의 쿼리는 page·limit·sort·order 뿐이라 탈퇴 여부나 기간으로
// 서버에서 거를 수 없다. 그래서 목록을 통째로 받아 화면에서 계산한다.
// 서버 limit 상한이 100 이라 페이지를 이어 붙인다.
const SERVER_LIMIT = 100
/** 안전장치. 이 수를 넘으면 최근 가입자부터 여기까지만 받는다. */
export const MAX_USERS = SERVER_LIMIT * 10

export interface AllUsersResult {
  /** 받아온 유저 목록(탈퇴 포함). 서버 기본 정렬이 가입 최신순이다. */
  users: UserResponse[]
  /** 서버가 알려준 전체 가입자 수(탈퇴 포함). 잘렸는지 판단에 쓴다. */
  totalCount: number
  isLoading: boolean
  isError: boolean
  /** 전체가 MAX_USERS 를 넘어 일부만 받아온 상태. */
  isTruncated: boolean
}

/**
 * 전체 유저를 한 번에 받아오는 훅. 유저 목록·대시보드 지표가 함께 쓴다.
 * 같은 쿼리 키를 쓰므로 두 화면을 오갈 때 캐시를 재사용한다.
 */
export function useAllUsers(): AllUsersResult {
  // 첫 페이지로 전체 인원 수를 알아낸 뒤 남은 페이지를 한꺼번에 받는다.
  const firstPage = useUsersControllerGetAllUsers({
    page: 1,
    limit: SERVER_LIMIT,
  })
  const totalCount = firstPage.data?.data.metadata?.total ?? 0
  const pageCount = Math.min(
    Math.ceil(totalCount / SERVER_LIMIT),
    MAX_USERS / SERVER_LIMIT,
  )

  const restPages = useQueries({
    queries: Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) =>
      getUsersControllerGetAllUsersQueryOptions({
        page: i + 2,
        limit: SERVER_LIMIT,
      }),
    ),
  })

  const users: UserResponse[] = [
    ...(firstPage.data?.data.items ?? []),
    ...restPages.flatMap((q) => q.data?.data.items ?? []),
  ]

  return {
    users,
    totalCount,
    isLoading: firstPage.isLoading || restPages.some((q) => q.isLoading),
    isError: firstPage.isError || restPages.some((q) => q.isError),
    isTruncated: totalCount > MAX_USERS,
  }
}
