import { Button } from '@heroui/react'
import { Modal } from './modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** 삭제 등 되돌리기 어려운 동작 전에 띄우는 확인 모달. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '삭제',
  isPending,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onPress={onClose} isDisabled={isPending}>
            취소
          </Button>
          <Button variant="danger" onPress={onConfirm} isDisabled={isPending}>
            {isPending ? '처리 중…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground/80">{message}</p>
    </Modal>
  )
}
