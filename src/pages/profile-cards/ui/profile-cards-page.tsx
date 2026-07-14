import { useState } from 'react'
import { Button, Chip } from '@heroui/react'
import {
  useProfileCardsControllerGetProfileCards,
  useProfileCardsControllerGetProfileCard,
} from '../../../shared/api/endpoints/profile-cards/profile-cards'
import type { ProfileCardResponse } from '../../../shared/api/model'
import {
  PageHeader,
  DataTable,
  Modal,
  PaginationBar,
  type Column,
} from '../../../shared/ui'

const LIMIT = 10

const LINK_TYPE_LABELS = [
  'EMAIL',
  'INSTAGRAM',
  'GITHUB',
  'LINKEDIN',
  'BEHANCE',
  'NOTION',
  'WEBSITE',
]

export function ProfileCardsPage() {
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isError } =
    useProfileCardsControllerGetProfileCards({ page, limit: LIMIT })

  const items = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  const columns: Column<ProfileCardResponse>[] = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (c) => c.nickname,
    },
    {
      key: 'description',
      header: '소개',
      render: (c) => (
        <span className="line-clamp-1 text-foreground/70">{c.description}</span>
      ),
    },
    {
      key: 'affiliation',
      header: '소속',
      render: (c) => c.affiliation ?? '-',
      className: 'text-foreground/70',
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-32',
      render: (c) => (
        <div className="flex gap-1">
          {c.isDefault && (
            <Chip size="sm" variant="secondary">
              기본
            </Chip>
          )}
          <Chip size="sm" color={c.isActive ? 'success' : 'default'}>
            {c.isActive ? '활성' : '비활성'}
          </Chip>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (card) => (
        <Button size="sm" variant="ghost" onPress={() => setDetailId(card.id)}>
          상세
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="프로필 카드"
        description="유저 프로필 카드 목록/상세를 조회합니다."
      />

      <DataTable
        columns={columns}
        items={items}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="등록된 프로필 카드가 없습니다."
      />

      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      <ProfileCardDetailModal
        cardId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}

function ProfileCardDetailModal({
  cardId,
  onClose,
}: {
  cardId: string | null
  onClose: () => void
}) {
  const { data, isLoading, isError } = useProfileCardsControllerGetProfileCard(
    cardId ?? '',
    { query: { enabled: cardId !== null } },
  )
  const card = data?.data

  return (
    <Modal isOpen={cardId !== null} onClose={onClose} title="프로필 카드 상세">
      {isLoading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : isError || !card ? (
        <p className="text-sm text-muted">상세 정보를 불러오지 못했습니다.</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <DetailRow label="닉네임" value={card.nickname} />
          <DetailRow label="소개" value={card.description} />
          <DetailRow label="소속" value={card.affiliation ?? '-'} />
          <DetailRow label="직군" value={card.jobTypeName ?? '-'} />
          <DetailRow
            label="상태"
            value={`${card.isActive ? '활성' : '비활성'}${card.isDefault ? ' · 기본' : ''}`}
          />
          {card.skills && card.skills.length > 0 && (
            <DetailRow label="스킬" value={card.skills.join(', ')} />
          )}
          {card.interests && card.interests.length > 0 && (
            <DetailRow
              label="관심사"
              value={card.interests.map((i) => i.name).join(', ')}
            />
          )}
          {card.links && card.links.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-muted">링크</span>
              <ul className="flex flex-col gap-0.5 text-foreground">
                {card.links.map((link, idx) => (
                  <li key={idx}>
                    <span className="text-muted">
                      {LINK_TYPE_LABELS[link.type] ?? '기타'}:{' '}
                    </span>
                    {link.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DetailRow label="생성일" value={card.createdAt.isoString} />
        </div>
      )}
    </Modal>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
