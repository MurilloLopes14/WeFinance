import { downloadTransactionsCsv } from '@/api/transactions-export-api'
import type { TransactionFilters } from '@/components/transactions/transaction-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  buildTransactionExportParams,
  getDefaultExportDateRange,
  monthParamToDateRange,
  validateExportDateRange,
} from '@/lib/transaction-export-helpers'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type TransactionExportPopoverProps = {
  householdId: string
  filters: TransactionFilters
  disabled?: boolean
}

export function TransactionExportPopover({
  householdId,
  filters,
  disabled = false,
}: TransactionExportPopoverProps) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [rangeError, setRangeError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const range = filters.month
      ? monthParamToDateRange(filters.month)
      : getDefaultExportDateRange()

    setFrom(range.from)
    setTo(range.to)
    setRangeError(null)
  }, [open, filters.month])

  const handleExport = async () => {
    const validationError = validateExportDateRange(from, to)
    if (validationError) {
      setRangeError(validationError)
      return
    }

    setRangeError(null)
    setIsExporting(true)

    try {
      await downloadTransactionsCsv(
        householdId,
        buildTransactionExportParams(
          { from, to },
          { type: filters.type, accountId: filters.accountId },
        ),
      )
      toast.success('Arquivo CSV gerado com sucesso')
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível exportar as transações'))
    } finally {
      setIsExporting(false)
    }
  }

  const usesListFilters = filters.type !== 'all' || filters.accountId !== 'all'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || !householdId}
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl px-4"
            disabled={disabled || !householdId}
          />
        }
      >
        <Download className="size-4" />
        Exportar CSV
      </PopoverTrigger>

      <PopoverContent className="glass-strong w-80" align="end" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle>Exportar transações</PopoverTitle>
          <PopoverDescription>
            Selecione o período para gerar o arquivo CSV.
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-3 px-0.5">
          <div className="space-y-2">
            <Label htmlFor="transaction-export-from">Data inicial</Label>
            <Input
              id="transaction-export-from"
              type="date"
              className="rounded-xl"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value)
                setRangeError(null)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-export-to">Data final</Label>
            <Input
              id="transaction-export-to"
              type="date"
              className="rounded-xl"
              value={to}
              onChange={(event) => {
                setTo(event.target.value)
                setRangeError(null)
              }}
            />
          </div>

          {usesListFilters && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Os filtros de tipo e conta da listagem também serão aplicados na exportação.
            </p>
          )}

          {rangeError && <p className="text-sm text-destructive">{rangeError}</p>}

          <Button
            type="button"
            className="glow-primary h-10 w-full rounded-xl"
            disabled={isExporting}
            onClick={() => {
              void handleExport()
            }}
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Download className="size-4" />
                Gerar CSV
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
