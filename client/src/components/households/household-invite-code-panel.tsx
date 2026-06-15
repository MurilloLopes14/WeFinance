import {
  getHouseholdsControllerGetInviteCodeQueryKey,
  useHouseholdsControllerGetInviteCode,
  useHouseholdsControllerRegenerateInviteCode,
} from '@/api/generated/households/households'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  copyInviteCode,
  formatInviteCodeDisplay,
  shareHouseholdInvite,
} from '@/lib/household-invite-helpers'
import { Check, Copy, Loader2, RefreshCw, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type HouseholdInviteCodePanelProps = {
  householdId: string
  householdName: string
  enabled?: boolean
}

export function HouseholdInviteCodePanel({
  householdId,
  householdName,
  enabled = true,
}: HouseholdInviteCodePanelProps) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerateSuccess, setRegenerateSuccess] = useState(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useHouseholdsControllerGetInviteCode(householdId, {
    query: { enabled: enabled && Boolean(householdId) },
  })

  const inviteCode = data?.inviteCode ?? ''

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  useEffect(() => {
    if (!regenerateSuccess) return

    const timeout = window.setTimeout(() => setRegenerateSuccess(false), 3000)
    return () => window.clearTimeout(timeout)
  }, [regenerateSuccess])

  const regenerateMutation = useHouseholdsControllerRegenerateInviteCode({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getHouseholdsControllerGetInviteCodeQueryKey(householdId),
        })
        setRegenerateSuccess(true)
        setRegenerateOpen(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível gerar um novo código'))
      },
    },
  })

  const handleCopy = async () => {
    if (!inviteCode) return

    try {
      await copyInviteCode(inviteCode)
      setCopied(true)
      toast.success('Código copiado')
    } catch {
      toast.error('Não foi possível copiar o código')
    }
  }

  const handleShare = async () => {
    if (!inviteCode) return

    try {
      const result = await shareHouseholdInvite(householdName, inviteCode)
      if (result === 'copied') {
        toast.success('Mensagem de convite copiada')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Não foi possível compartilhar o convite')
    }
  }

  const handleRegenerate = () => {
    if (!householdId) return
    regenerateMutation.mutate({ id: householdId })
  }

  const isBusy = regenerateMutation.isPending

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Código de convite</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Compartilhe o código para convidar pessoas ao grupo.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-18 w-full rounded-xl" />
        ) : isError ? (
          <div className="glass-subtle flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o código de convite.
            </p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className="glass-subtle rounded-xl px-4 py-5 text-center ring-1 ring-foreground/10"
              aria-label={`Código de convite: ${inviteCode}`}
            >
              <p className="font-mono text-xl tracking-[0.28em] text-foreground sm:text-2xl sm:tracking-[0.35em]">
                {formatInviteCodeDisplay(inviteCode)}
              </p>
            </div>
            {regenerateSuccess && (
              <Badge
                variant="outline"
                className="mx-auto flex w-fit gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400"
              >
                <Check className="size-3" />
                Novo código gerado
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={!inviteCode || isLoading || isError || isBusy}
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={!inviteCode || isLoading || isError || isBusy}
            onClick={() => void handleShare()}
          >
            <Share2 className="size-4" />
            Compartilhar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:text-destructive"
            disabled={!inviteCode || isLoading || isError || isBusy}
            onClick={() => setRegenerateOpen(true)}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Gerar novo
          </Button>
        </div>
      </div>

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar novo código?</AlertDialogTitle>
            <AlertDialogDescription>
              O código atual deixará de funcionar. Quem ainda não entrou precisará receber o
              novo código para acessar o grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isBusy}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={handleRegenerate}
              disabled={isBusy}
            >
              {isBusy && <Loader2 className="size-4 animate-spin" />}
              Gerar novo código
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
