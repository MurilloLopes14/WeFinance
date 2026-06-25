import { ObjectHeader } from '@/components/object/object-header'

export function BudgetHeader() {
  return (
    <ObjectHeader
      title="Orçamentos"
      tourAnchor="budgets-header"
      description="Defina o budget mensal do grupo e das categorias de despesa. Use o filtro de mês para planejar períodos futuros ou revisar meses anteriores."
    />
  )
}
