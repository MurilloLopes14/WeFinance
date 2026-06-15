import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const columnWidths = ['w-24', 'w-40', 'w-20', 'w-28', 'w-28', 'w-24']

export function TransactionTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {['Data', 'Descrição', 'Tipo', 'Conta', 'Categoria', 'Valor'].map(
              (label) => (
                <TableHead key={label} className="text-muted-foreground">
                  {label}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              {columnWidths.map((width, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className={cn('h-4', width, cellIndex === 5 && 'ml-auto')} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
