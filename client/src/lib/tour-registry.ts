import type { TourKey } from '@/lib/tour-keys'
import type { Step } from 'react-joyride'

const pageHeader = (key: TourKey): string => `[data-tour="${key}-header"]`

const tourRegistry: Record<TourKey, Step[]> = {
  help: [
    {
      target: '[data-tour="help-header"]',
      title: 'Central de Ajuda',
      content: 'Bem-vindo à documentação do WeFinance. Aqui você encontra guias completos de cada módulo.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="help-tabs"]',
      title: 'Navegue pelos módulos',
      content: 'Cada aba explica um módulo diferente: o que é, como funciona, como se conecta com o resto e dicas práticas.',
      placement: 'bottom',
      skipBeacon: true,
    },
  ],

  dashboard: [
    {
      target: '[data-tour="tour-sidebar"]',
      title: 'Menu lateral',
      content: 'Navegue entre Dashboard, Transações e a gestão do grupo. A Central de Ajuda está em Sistema para um guia completo do WeFinance.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="tour-nav-transactions"]',
      title: 'Transações',
      content: 'Registre despesas, receitas e transferências do household.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="tour-nav-groups"]',
      title: 'Gestão de grupos',
      content: 'Grupos, categorias, orçamentos, contas, fixos, pagadores e rateios ficam aqui.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="tour-nav-help"]',
      title: 'Central de Ajuda',
      content: 'Acesse a documentação completa do WeFinance com guias de cada módulo e dicas práticas.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="dashboard-header"]',
      title: 'Dashboard',
      content: 'Visão geral das finanças pessoais e do grupo no mês selecionado.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="dashboard-month"]',
      title: 'Filtro de mês',
      content: 'Altere o período para revisar indicadores, gráficos e calendário.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="dashboard-perspective"]',
      title: 'Você e Grupo',
      content: 'Na aba Você, veja receitas, despesas e saldos segregados (disponível, investido e total). Na aba Grupo, acompanhe o household.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="dashboard-reports"]',
      title: 'Relatórios',
      content: 'Acompanhe a evolução do saldo, a distribuição de despesas por categoria e o calendário financeiro do mês. Clique em um dia para ver as movimentações.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  transactions: [
    {
      target: pageHeader('transactions'),
      title: 'Transações',
      content: 'Liste e filtre movimentações por grupo, mês, tipo e conta.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="transactions-toolbar"]',
      title: 'Busca e filtros',
      content: 'Refine a listagem ou exporte o período em CSV.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="transactions-insights"]',
      title: 'Insights',
      content: 'Alertas e análises automáticas do grupo — orçamentos estourados, tendências e oportunidades de economia no período filtrado.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="transactions-table"]',
      title: 'Tabela de transações',
      content: 'Todas as movimentações do grupo aparecem aqui, com paginação. Edite ou exclua registros diretamente na linha.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  households: [
    {
      target: pageHeader('households'),
      title: 'Grupos',
      content: 'Crie households, convide membros e configure rateio padrão.',
      placement: 'bottom',
      skipBeacon: true,
    },
  ],

  categories: [
    {
      target: pageHeader('categories'),
      title: 'Categorias',
      content: 'Organize despesas, receitas e transferências por grupo.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="categories-list"]',
      title: 'Suas categorias',
      content: 'Visualize todas as categorias em cards, com tipo, grupo e hierarquia. Use busca e filtros para encontrar rapidamente.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  budgets: [
    {
      target: pageHeader('budgets'),
      title: 'Orçamentos',
      content: 'Defina budgets mensais do grupo e das categorias de despesa.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="budgets-month"]',
      title: 'Período',
      content: 'Escolha o mês que deseja planejar ou revisar.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="budgets-copy"]',
      title: 'Copiar do mês anterior',
      content: 'Facilite o planejamento trazendo os orçamentos do mês passado para o atual. Valores já definidos não são sobrescritos.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="budgets-view"]',
      title: 'Orçamentos do grupo',
      content: 'Alterne entre orçamento do grupo e por categoria de despesa. Edite os valores diretamente nos cards.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  accounts: [
    {
      target: pageHeader('accounts'),
      title: 'Contas',
      content: 'Cadastre contas do grupo. Contas de investimento aceitam rendimento estimado e data de vencimento.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="accounts-list"]',
      title: 'Suas contas',
      content: 'Visualize saldos, tipos e grupos de cada conta em cards. Edite ou remova contas que você gerencia.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  subscriptions: [
    {
      target: pageHeader('subscriptions'),
      title: 'Fixos',
      content: 'Gerencie despesas e receitas recorrentes vinculadas a categorias.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="subscriptions-list"]',
      title: 'Seus fixos',
      content: 'Acompanhe recorrências ativas e inativas, valores e próximas cobranças. Filtre por grupo, tipo ou status.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  payees: [
    {
      target: pageHeader('payees'),
      title: 'Pagadores e recebedores',
      content:
        'Cadastre quem paga ou recebe nas transações do grupo. Você também pode criar rapidamente ao registrar uma transação.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="payees-toolbar"]',
      title: 'Busca e filtros',
      content:
        'Encontre pagadores por nome ou filtre por grupo. Proprietários podem cadastrar novos registros pelo botão no canto.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="payees-list"]',
      title: 'Lista de pagadores',
      content:
        'Veja nome, categoria padrão e regras de importação CSV. Edite ou exclua registros diretamente na tabela.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  splits: [
    {
      target: pageHeader('splits'),
      title: 'Rateios',
      content: 'Acompanhe divisões de despesas entre membros do grupo.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="splits-list"]',
      title: 'Divisões',
      content: 'Veja quem pagou, quem deve e quanto cada membro ficou responsável em cada transação com rateio.',
      placement: 'top',
      skipBeacon: true,
    },
  ],

  profile: [
    {
      target: pageHeader('profile'),
      title: 'Perfil',
      content: 'Centralize aqui foto, dados pessoais e segurança da sua conta.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="profile-avatar"]',
      title: 'Foto de perfil',
      content: 'Envie uma imagem para personalizar sua identidade no app e nas finanças compartilhadas do grupo.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="profile-basic-info"]',
      title: 'Dados pessoais',
      content: 'Edite nome, e-mail, telefone e data de nascimento quando precisar atualizar.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="profile-password"]',
      title: 'Alterar senha',
      content: 'Troque sua senha de acesso com a senha atual e a nova confirmação. A alteração é feita aqui no perfil.',
      placement: 'top',
      skipBeacon: true,
    },
  ],
}

export function getTourSteps(tourKey: TourKey): Step[] {
  return tourRegistry[tourKey] ?? []
}

export function filterAvailableTourSteps(steps: Step[]): Step[] {
  if (typeof document === 'undefined') return steps

  return steps.filter((step) => {
    if (typeof step.target !== 'string') return true
    return document.querySelector(step.target) !== null
  })
}
