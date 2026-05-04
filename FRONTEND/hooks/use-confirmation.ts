import { useState } from "react"

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning" | "info"
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: "",
    description: "",
  })
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null)

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setResolveCallback(() => resolve)
    })
  }

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (resolveCallback) {
      resolveCallback(false)
    }
    setIsOpen(false)
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen,
  }
}

