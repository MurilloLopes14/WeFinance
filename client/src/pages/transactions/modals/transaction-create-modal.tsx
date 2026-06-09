import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TransactionCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionCreateModal({ open, onOpenChange }: TransactionCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription>
            Registre uma despesa, receita ou transferência entre contas.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-muted-foreground">
          O formulário de cadastro será implementado na próxima etapa deste módulo.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
