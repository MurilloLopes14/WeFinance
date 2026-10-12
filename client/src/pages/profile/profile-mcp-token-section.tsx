import {
  accessTokensQueryKey,
  createMyMcpToken,
  listMyMcpTokens,
  revokeMyMcpToken,
  type AccessTokenSummary,
} from '@/api/access-tokens-api'
import { defaultQueryOptions } from '@/api/default-query-options'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function formatTokenDate(value: string) {
  return format(new Date(value), "d 'de' MMM 'de' yyyy", { locale: ptBR })
}

export function ProfileMcpTokenSection() {
  const queryClient = useQueryClient()
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)

  const tokensQuery = useQuery({
    ...defaultQueryOptions({
      queryFn: ({ signal }) => listMyMcpTokens(signal),
    }),
    queryKey: accessTokensQueryKey,
  })

  const createMutation = useMutation({
    mutationFn: createMyMcpToken,
    onSuccess: async (created) => {
      setFreshToken(created.token)
      setCopied(false)
      await queryClient.invalidateQueries({ queryKey: accessTokensQueryKey })
      toast.success('Token gerado. Copie agora — ele não será mostrado de novo.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível gerar o token'))
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeMyMcpToken,
    onSuccess: async () => {
      setPendingRevokeId(null)
      await queryClient.invalidateQueries({ queryKey: accessTokensQueryKey })
      toast.success('Token revogado')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível revogar o token'))
    },
  })

  const copyToken = async () => {
    if (!freshToken) return
    await navigator.clipboard.writeText(freshToken)
    setCopied(true)
    toast.success('Token copiado')
  }

  const tokens = tokensQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexão com agentes</CardTitle>
        <CardDescription>
          Gere um token para conectar o WeFinance a agentes e sistemas via MCP.
          Envie-o no header <span className="font-medium text-foreground">x-access-token</span>.
          O valor completo aparece só no momento da criação.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {freshToken ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-mcp-token">Token gerado agora</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="profile-mcp-token"
                readOnly
                value={freshToken}
                className="h-11 font-mono text-xs touch-manipulation sm:h-9"
                spellCheck={false}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 touch-manipulation sm:h-9"
                onClick={() => {
                  void copyToken()
                }}
              >
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Guarde este token em um cofre. Depois de sair desta tela, só dá para revogar e gerar outro.
            </p>
          </div>
        ) : null}

        {tokensQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" aria-hidden="true" />
            Carregando tokens…
          </div>
        ) : tokensQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar seus tokens.
          </p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum token ativo. Gere um para conectar um agente.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tokens.map((token) => (
              <TokenRow
                key={token.id}
                token={token}
                confirming={pendingRevokeId === token.id}
                revoking={revokeMutation.isPending && pendingRevokeId === token.id}
                onAskRevoke={() => setPendingRevokeId(token.id)}
                onCancelRevoke={() => setPendingRevokeId(null)}
                onConfirmRevoke={() => revokeMutation.mutate(token.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="button"
          className="h-11 touch-manipulation sm:h-9"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          Gerar token
        </Button>
      </CardFooter>
    </Card>
  )
}

type TokenRowProps = {
  token: AccessTokenSummary
  confirming: boolean
  revoking: boolean
  onAskRevoke: () => void
  onCancelRevoke: () => void
  onConfirmRevoke: () => void
}

function TokenRow({
  token,
  confirming,
  revoking,
  onAskRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: TokenRowProps) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">Token MCP</p>
        <p className="text-xs text-muted-foreground">
          Criado em {formatTokenDate(token.createdAt)} · expira em {formatTokenDate(token.expiresAt)}
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11 touch-manipulation sm:h-8"
            onClick={onCancelRevoke}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 touch-manipulation sm:h-8"
            disabled={revoking}
            onClick={onConfirmRevoke}
          >
            {revoking ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Revogar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 touch-manipulation sm:h-8"
          onClick={onAskRevoke}
        >
          Revogar
        </Button>
      )}
    </li>
  )
}
