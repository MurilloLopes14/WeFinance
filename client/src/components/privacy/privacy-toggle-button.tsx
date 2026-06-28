import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

type PrivacyToggleButtonProps = {
  className?: string
}

export function PrivacyToggleButton({ className }: PrivacyToggleButtonProps) {
  const { amountsHidden, toggleAmountsHidden } = usePrivacyMode()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('glass-subtle size-10 shrink-0 rounded-xl', className)}
      onClick={toggleAmountsHidden}
      aria-label={amountsHidden ? 'Mostrar valores' : 'Ocultar valores'}
      aria-pressed={amountsHidden}
      title={amountsHidden ? 'Mostrar valores' : 'Ocultar valores'}
    >
      {amountsHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  )
}
