export type HelpSection = {
  title: string
  body: string
  bullets?: string[]
}

export type HelpModule = {
  key: string
  label: string
  iconName: string
  tagline: string
  description: string
  sections: HelpSection[]
  tips: string[]
  relatedKeys: string[]
}

export const HELP: HelpModule[] = [
  {
    key: 'overview',
    label: 'Visão Geral',
    iconName: 'Compass',
    tagline: 'Entenda como o WeFinance funciona de ponta a ponta.',
    description:
      'O WeFinance organiza suas finanças em torno de grupos — chamados de households. Tudo o que você registra (contas, categorias, transações, orçamentos) pertence a um grupo, tornando a gestão financeira compartilhada simples e transparente.',
    sections: [
      {
        title: 'O fluxo recomendado de configuração',
        body: 'Siga esta ordem ao começar para que tudo funcione corretamente desde o início.',
        bullets: [
          '1. Crie ou entre em um Grupo — é o ponto de partida de tudo.',
          '2. Cadastre suas Contas — onde está o dinheiro (corrente, poupança, investimento).',
          '3. Crie Categorias — para classificar despesas, receitas e transferências.',
          '4. Registre Transações — o coração do app. Toda movimentação financeira passa por aqui.',
          '5. Configure Orçamentos — planeje quanto pretende gastar por mês.',
          '6. Cadastre Fixos — automatize despesas e receitas que se repetem todo mês.',
          '7. Use Rateios — nas transações compartilhadas entre membros do grupo.',
          '8. Consulte o Dashboard — acompanhe tudo em tempo real com gráficos e insights.',
        ],
      },
      {
        title: 'Como os módulos se conectam',
        body: 'O WeFinance é construído em camadas. Cada módulo depende dos anteriores e alimenta os seguintes:',
        bullets: [
          'Grupos são a base — todas as outras entidades pertencem a um grupo.',
          'Contas e Categorias dão estrutura — sem elas, as transações não têm contexto.',
          'Transações são o núcleo — alimentam Dashboard, Orçamentos, Rateios e insights.',
          'Fixos são transações recorrentes planejadas — aparecem no calendário do Dashboard.',
          'Orçamentos comparam o planejado com o real — calculados a partir das transações.',
          'Rateios dividem o custo de uma transação — calculados dentro de cada movimentação.',
          'Dashboard agrega tudo — KPIs, gráficos, calendário e análises automáticas.',
        ],
      },
      {
        title: 'Proprietário vs. Membro',
        body: 'Cada grupo tem um proprietário (quem criou) e pode ter vários membros. O proprietário tem controle total; membros podem registrar transações e visualizar dados, mas não alteram configurações do grupo.',
        bullets: [
          'Proprietário: cria/edita contas, categorias, orçamentos, fixos e o próprio grupo.',
          'Membro: registra transações, visualiza relatórios e participa de rateios.',
          'Você pode ser proprietário de um grupo e membro de outro ao mesmo tempo.',
        ],
      },
    ],
    tips: [
      'Comece sempre pelo passo 1: criar um grupo. Sem ele, nenhuma outra função está disponível.',
      'Você pode estar em vários grupos — útil para separar finanças pessoais de um grupo familiar ou republiqueiro.',
      'O código de convite do grupo é a forma mais rápida de adicionar membros. Compartilhe no chat do grupo.',
      'Se você é o único usuário, crie mesmo assim um grupo — é o modelo que o WeFinance usa.',
    ],
    relatedKeys: ['households', 'dashboard'],
  },

  {
    key: 'dashboard',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    tagline: 'Sua central financeira em tempo real.',
    description:
      'O Dashboard é a tela principal do WeFinance. Ele consolida todas as informações do mês em KPIs, gráficos e análises automáticas, dando uma visão clara da sua situação financeira pessoal e do grupo.',
    sections: [
      {
        title: 'KPIs — os três indicadores principais',
        body: 'No topo do dashboard você vê três números que resumem sua situação financeira:',
        bullets: [
          'Disponível — soma dos saldos de contas corrente e poupança. É o dinheiro que você pode usar hoje.',
          'Investido — soma dos saldos em contas de investimento. Capital alocado e rendendo.',
          'Total — Disponível + Investido. Seu patrimônio líquido total no grupo.',
        ],
      },
      {
        title: 'Perspectivas: Você e Grupo',
        body: 'As abas "Você" e "Grupo" alternam a visão entre suas movimentações pessoais e as do household completo. Use "Você" para analisar seus gastos individuais e "Grupo" para ver o panorama compartilhado.',
      },
      {
        title: 'Calendário financeiro',
        body: 'O calendário mostra o saldo líquido de cada dia do mês (receitas − despesas). Clique em qualquer dia para ver as transações daquele dia em um painel lateral. Dias positivos ficam em verde; negativos, em vermelho.',
      },
      {
        title: 'Gráfico de Evolução do Saldo',
        body: 'Mostra como o saldo acumulado variou ao longo do tempo. Com os filtros "Mês atual" e "1 mês", o gráfico exibe granularidade diária — você vê cada dia do mês. Com 3+ meses, a visão é mensal.',
        bullets: [
          'Mês atual — saldo dia a dia do mês calendário presente.',
          '1 mês — saldo dia a dia do mês selecionado no filtro.',
          '3, 6, 12, 24 meses — visão mensal acumulada do período.',
        ],
      },
      {
        title: 'Insights automáticos',
        body: 'O WeFinance gera análises automáticas com base nas suas transações do mês. Eles aparecem como cards coloridos: verde para situações positivas, amarelo para alertas e azul para informações neutras.',
        bullets: [
          'Orçamento estourado ou próximo do limite.',
          'Tendências de gasto acima da média.',
          'Categorias com aumento significativo.',
        ],
      },
      {
        title: 'Fixos próximos',
        body: 'O painel "Próximos Fixos" lista as despesas e receitas recorrentes que vencem nos próximos dias. Uma forma rápida de se preparar para o fluxo de caixa da semana.',
      },
    ],
    tips: [
      'Use o seletor de mês para navegar pelo histórico financeiro. Os KPIs, gráficos e calendário mudam de acordo.',
      'A perspectiva "Você" é pessoal — inclui apenas transações associadas à sua conta. "Grupo" inclui todos os membros.',
      'Se você está em vários grupos, o seletor de grupo (aba Grupo) permite alternar sem sair do dashboard.',
      'O gráfico de donut mostra despesas por categoria — clique nas legendas para ver proporções.',
    ],
    relatedKeys: ['transactions', 'accounts', 'subscriptions'],
  },

  {
    key: 'transactions',
    label: 'Transações',
    iconName: 'ArrowLeftRight',
    tagline: 'O coração do WeFinance — toda movimentação financeira passa por aqui.',
    description:
      'Transações são o registro de tudo que entra e sai. Cada transação pertence a um grupo, tem um tipo (despesa, receita ou transferência), uma data, um valor e pode ter categoria, conta e rateio.',
    sections: [
      {
        title: 'Tipos de transação',
        body: 'Existem três tipos, e a escolha correta é importante para que os relatórios e orçamentos funcionem bem:',
        bullets: [
          'Despesa — dinheiro que sai (compras, contas, serviços). Conta para orçamentos e insights.',
          'Receita — dinheiro que entra (salário, freelance, vendas). Melhora o saldo disponível.',
          'Transferência — movimentação entre contas próprias do grupo (ex.: da corrente para a poupança). Não afeta o saldo líquido.',
        ],
      },
      {
        title: 'Filtros e busca',
        body: 'Use a barra de filtros para encontrar transações por grupo, mês, tipo e conta. A busca por texto filtra pela descrição da transação em tempo real.',
      },
      {
        title: 'Rateio (divisão entre membros)',
        body: 'Ao criar uma transação de despesa, ative o rateio para dividir o custo entre membros do grupo. Defina a porcentagem de cada pessoa — o total deve ser 100%. A transação aparecerá na tela de Rateios com o resumo de quem deve a quem.',
      },
      {
        title: 'Edição e exclusão',
        body: 'Transações podem ser editadas ou excluídas pelo menu de ações na tabela (ou no card, no mobile). Apenas quem criou a transação pode alterá-la, e somente nas primeiras 24 horas após a criação. Depois desse prazo, o registro fica bloqueado para edição e exclusão.',
      },
      {
        title: 'Exportação para CSV',
        body: 'Clique no ícone de download na barra de filtros para exportar as transações do período atual para CSV. O arquivo pode ser aberto no Excel, Google Sheets ou qualquer planilha.',
      },
    ],
    tips: [
      'Selecione o mês correto antes de criar a transação — ela ficará vinculada à data informada.',
      'Use categorias sempre que possível: os orçamentos e relatórios só funcionam bem com transações categorizadas.',
      'Transferências entre contas não devem ser classificadas como despesa — isso evita dupla contagem no saldo.',
      'Transações só podem ser editadas ou excluídas nas primeiras 24 horas após a criação, e apenas por quem as registrou.',
      'Insights aparecem automaticamente abaixo dos filtros. São análises do mês do grupo selecionado.',
      'A exportação CSV inclui somente as transações do mês e grupo filtrados no momento do download.',
    ],
    relatedKeys: ['categories', 'accounts', 'splits', 'budgets'],
  },

  {
    key: 'households',
    label: 'Grupos',
    iconName: 'Users',
    tagline: 'A base de tudo no WeFinance — finanças organizadas por household.',
    description:
      'Um grupo (household) é o núcleo organizacional do WeFinance. Todas as contas, categorias, transações, orçamentos e fixos pertencem a um grupo. Você pode criar grupos diferentes para contextos distintos — por exemplo, finanças pessoais e finanças da república.',
    sections: [
      {
        title: 'Criando um grupo',
        body: 'Qualquer usuário pode criar um grupo. Ao criá-lo, você se torna o proprietário e pode convidar outras pessoas. Defina o nome, a moeda padrão e escolha se quer manter orçamentos de grupos anteriores.',
      },
      {
        title: 'Convidar membros',
        body: 'Dentro do grupo, há um código de convite. Compartilhe esse código com quem você quer adicionar. A outra pessoa acessa Grupos → "Entrar com código" e insere o código para se tornar membro.',
      },
      {
        title: 'Permissões: o que cada papel pode fazer',
        body: 'O papel define o que cada pessoa pode fazer dentro do grupo:',
        bullets: [
          'Proprietário: cria, edita e exclui contas, categorias, orçamentos, fixos e o grupo.',
          'Membro: registra e edita suas próprias transações, visualiza relatórios e participa de rateios.',
          'Apenas o proprietário pode remover membros ou transferir a propriedade.',
        ],
      },
      {
        title: 'Opção "Manter orçamentos"',
        body: 'Ao criar um novo grupo, você pode copiar os orçamentos de um grupo existente. Isso evita reconfigurá-los do zero quando você reorganiza seus grupos.',
      },
    ],
    tips: [
      'Dê nomes descritivos aos grupos: "Família Silva", "Republiqueiros" ou "Finanças Pessoais".',
      'Um grupo com moeda BRL não pode ter contas em EUR — a moeda é definida por grupo.',
      'Remova membros com cuidado: as transações deles permanecem no grupo, mas eles perdem o acesso.',
      'Se você quer gerenciar finanças individuais e familiares separadamente, crie dois grupos.',
    ],
    relatedKeys: ['categories', 'accounts', 'budgets', 'subscriptions'],
  },

  {
    key: 'categories',
    label: 'Categorias',
    iconName: 'Tags',
    tagline: 'Classifique cada centavo para relatórios que realmente fazem sentido.',
    description:
      'Categorias organizam as transações em grupos temáticos — Alimentação, Moradia, Transporte, Lazer. Sem categorias, os gráficos e orçamentos perdem o poder de análise.',
    sections: [
      {
        title: 'Tipos de categoria',
        body: 'Cada categoria tem um tipo que deve corresponder ao tipo de transação:',
        bullets: [
          'Despesa — usada em transações de despesa. Aparece nos orçamentos por categoria.',
          'Receita — usada em transações de receita. Ajuda a entender fontes de entrada.',
          'Transferência — usada em transferências entre contas. Organiza movimentações internas.',
        ],
      },
      {
        title: 'Hierarquia de categorias',
        body: 'Você pode criar subcategorias dentro de categorias pai. Por exemplo: "Alimentação" (pai) → "Mercado", "Restaurante", "Delivery" (filhos). As subcategorias dão granularidade nos relatórios sem perder a visão geral.',
        bullets: [
          'Categoria pai: agrupamento amplo (ex.: Moradia).',
          'Subcategoria: detalhamento específico (ex.: Aluguel, Condomínio, Luz).',
          'No gráfico de donut, você vê o pai. Nas transações, pode filtrar pela subcategoria.',
        ],
      },
      {
        title: 'Quem pode gerenciar',
        body: 'Apenas o proprietário do grupo pode criar, editar e excluir categorias. Membros podem usá-las ao registrar transações.',
      },
    ],
    tips: [
      'Crie as categorias antes de começar a lançar transações — economiza tempo na hora do registro.',
      'Use o tipo correto: uma categoria "Salário" deve ser do tipo Receita, não Despesa.',
      'Subcategorias são opcionais, mas muito úteis para quem quer análises detalhadas.',
      'Ao excluir uma categoria, as transações vinculadas a ela perdem a classificação. Considere renomear em vez de excluir.',
      'Você não precisa categorizar tudo de imediato — edite as transações depois quando for organizar o mês.',
    ],
    relatedKeys: ['transactions', 'budgets'],
  },

  {
    key: 'budgets',
    label: 'Orçamentos',
    iconName: 'PiggyBank',
    tagline: 'Planeje o mês antes de gastar e acompanhe em tempo real.',
    description:
      'Orçamentos definem um teto de gastos para o mês — tanto para o grupo inteiro quanto para cada categoria de despesa. O WeFinance compara automaticamente o orçado com o realizado e gera alertas quando você está próximo do limite.',
    sections: [
      {
        title: 'Orçamento do grupo',
        body: 'O orçamento do grupo define o teto geral de despesas do household no mês. Ele é exibido como um card para cada grupo que você gerencia. Útil para ter uma visão macro do quanto o grupo pode gastar.',
      },
      {
        title: 'Orçamento por categoria',
        body: 'Cada categoria de despesa pode ter seu próprio orçamento mensal. Por exemplo: R$ 800 em Alimentação, R$ 200 em Transporte. Na aba Categorias, você vê uma barra de progresso mostrando o quanto já foi usado.',
      },
      {
        title: 'Copiar do mês anterior',
        body: 'Clique em "Copiar do mês anterior" para trazer os orçamentos do mês passado para o mês atual. Valores que já estão definidos não são sobrescritos — somente os campos em branco são preenchidos. Muito útil para meses com padrão similar.',
      },
      {
        title: 'Abas: Grupo e Categorias',
        body: 'A página de orçamentos tem duas abas. A aba Grupo mostra o orçamento geral de cada household. A aba Categorias permite detalhar o orçamento por área de gasto do grupo selecionado.',
      },
    ],
    tips: [
      'Defina orçamentos no início do mês e consulte ao longo do mês — o progresso atualiza em tempo real.',
      'O insight de "orçamento estourado" no Dashboard só aparece se você configurou um orçamento para aquela categoria.',
      'Use "Copiar do mês anterior" como ponto de partida e ajuste o que mudou — é mais rápido que preencher do zero.',
      'Orçamentos são mensais e por grupo. Você precisa configurar separadamente para cada grupo que gerencia.',
      'Apenas o proprietário do grupo pode criar e editar orçamentos.',
    ],
    relatedKeys: ['categories', 'transactions', 'dashboard'],
  },

  {
    key: 'accounts',
    label: 'Contas',
    iconName: 'Landmark',
    tagline: 'Registre onde está seu dinheiro e acompanhe saldos por tipo.',
    description:
      'Contas representam onde o dinheiro do grupo está alocado. Cada transação está vinculada a uma ou mais contas, e os saldos são calculados automaticamente com base nas movimentações registradas.',
    sections: [
      {
        title: 'Tipos de conta',
        body: 'O tipo da conta define como ela aparece nos KPIs do Dashboard:',
        bullets: [
          'Corrente — conta-corrente bancária. Soma para o Disponível no Dashboard.',
          'Poupança — conta de poupança ou reserva de emergência. Soma para o Disponível.',
          'Investimento — aplicações financeiras. Soma para o Investido no Dashboard.',
          'Crédito — cartão de crédito ou limite. Registre despesas no crédito como despesas normais.',
        ],
      },
      {
        title: 'Cartões de crédito',
        body: 'Contas do tipo Crédito têm campos extras para acompanhar faturas e limites:',
        bullets: [
          'Limite de crédito — valor máximo do cartão. Usado para calcular quanto ainda está disponível.',
          'Dia de fechamento — quando a fatura fecha (1 a 28). Despesas após essa data entram na próxima fatura.',
          'Dia de vencimento — calculado automaticamente como fechamento + 7 dias.',
          'O saldo da conta fica negativo conforme você registra despesas — isso representa o valor a pagar na fatura atual, não um erro.',
          'No Dashboard (aba Você), o card A pagar mostra o total das faturas em aberto e o painel de cartões detalha cada um.',
        ],
      },
      {
        title: 'Contas de investimento',
        body: 'Contas de investimento têm campos adicionais para acompanhamento de rentabilidade:',
        bullets: [
          'Rendimento estimado (%) — taxa anual, mensal ou diária esperada.',
          'Granularidade — diário, mensal ou anual. Define o período do rendimento.',
          'Data de vencimento — para CDBs, LCIs e outros investimentos com prazo definido.',
          'Essas informações alimentam projeções e insights de vencimento no Dashboard.',
        ],
      },
      {
        title: 'Quem pode gerenciar',
        body: 'Apenas o proprietário do grupo pode criar, editar e excluir contas. Membros podem vincular transações às contas existentes.',
      },
    ],
    tips: [
      'Use o tipo correto para que os KPIs do Dashboard (Disponível vs. Investido) sejam calculados corretamente.',
      'Você não precisa inserir saldos iniciais — o WeFinance calcula tudo com base nas transações registradas. Se quiser refletir um saldo real, registre uma transação de Receita com o valor inicial.',
      'Para cartão de crédito, registre as compras como Despesa na conta de crédito e o pagamento da fatura como Transferência da conta corrente para a conta de crédito — assim o saldo do cartão volta a zero.',
      'Configure limite e dia de fechamento no cadastro do cartão para receber insights sobre datas importantes no Dashboard.',
      'Contas de investimento com data de vencimento próxima geram insights de alerta no Dashboard.',
    ],
    relatedKeys: ['transactions', 'dashboard'],
  },

  {
    key: 'subscriptions',
    label: 'Fixos',
    iconName: 'CalendarClock',
    tagline: 'Automatize e acompanhe despesas e receitas que se repetem todo mês.',
    description:
      'Fixos são receitas ou despesas recorrentes — aluguel, salário, Netflix, academia, plano de saúde. Eles aparecem no painel "Próximos Fixos" do Dashboard como um lembrete do fluxo de caixa esperado.',
    sections: [
      {
        title: 'O que é um fixo',
        body: 'Um fixo registra que um valor vai entrar ou sair regularmente. Na data de execução, o WeFinance lança a transação automaticamente na conta vinculada e atualiza o saldo. Fixos ativos também aparecem no painel "Próximos Fixos" do Dashboard como lembrete do fluxo de caixa.',
      },
      {
        title: 'Campos principais',
        body: 'Ao criar um fixo, defina:',
        bullets: [
          'Nome — descrição clara (ex.: "Netflix", "Aluguel Ap. 42").',
          'Tipo — Despesa ou Receita. Define como ele aparece nos resumos.',
          'Valor — o valor de cada ocorrência (em parcelamentos, o valor de cada parcela).',
          'Conta e categoria — usadas na transação gerada automaticamente.',
          'Cadência — intervalo entre execuções (ex.: a cada 1 mês).',
          'Próxima execução — data em que a primeira (ou próxima) transação será lançada.',
          'Ativo/Inativo — se inativo, não executa nem aparece nos próximos fixos.',
        ],
      },
      {
        title: 'Parcelamentos',
        body: 'Para compras ou recebimentos com prazo definido (celular em 12x, empréstimo, consórcio), marque "Este fixo é um parcelamento" e informe o total de parcelas. O valor informado vale para cada parcela; a cadência define o intervalo entre elas.',
        bullets: [
          'Na execução, a transação é criada com descrição no formato "(N/total): nome" — por exemplo, "(3/12): iPhone 15".',
          'Cada parcela gerada é registrada no fixo; ao concluir todas, o parcelamento é desativado automaticamente.',
          'No card do fixo, acompanhe o progresso (ex.: 3/12) e quantas parcelas ainda faltam.',
        ],
      },
      {
        title: 'Antecipar parcelas',
        body: 'Se uma parcela vence antes da data programada — ou você quer quitá-la manualmente — use uma transação com antecipação. Disponível ao criar transação (despesa ou receita, não transferência) para o proprietário do grupo.',
        bullets: [
          'Marque "Antecipar parcela" e selecione o parcelamento ativo com parcelas pendentes do mesmo tipo.',
          'Escolha qual parcela quitar; por padrão, a próxima pendente já vem selecionada.',
          'Conta, valor e categoria são preenchidos a partir do fixo; a transação aparece como "Parcela Antecipada (N/total): …".',
          'Antecipar uma parcela fora de ordem não altera as datas das demais — só a próxima da fila adianta o calendário do fixo.',
        ],
      },
      {
        title: 'Ativar e desativar',
        body: 'Em vez de excluir um fixo sazonal (ex.: IPTU anual), desative-o quando não for mais recorrente. Isso preserva o histórico e facilita reativar no futuro. Parcelamentos concluídos são desativados sozinhos.',
      },
    ],
    tips: [
      'Use fixos para planejar o fluxo de caixa — você vê no Dashboard quais saídas e entradas esperar nos próximos dias.',
      'Para parcelamentos, confira o progresso no card do fixo antes de antecipar — evita pagar a mesma parcela duas vezes.',
      'Alinhe a cadência ao vencimento real (mensal para cartão, quinzenal para salário) e use a data da primeira parcela em "Próxima execução".',
      'Inative fixos sazonais (IPVA, IPTU, seguro anual) ao invés de excluir.',
      'O painel de Próximos Fixos no Dashboard mostra os 5 mais próximos — útil para planejar a semana.',
    ],
    relatedKeys: ['transactions', 'categories', 'dashboard'],
  },

  {
    key: 'splits',
    label: 'Rateios',
    iconName: 'PieChart',
    tagline: 'Divida despesas entre membros do grupo com total transparência.',
    description:
      'Rateios permitem dividir o custo de uma transação entre membros do grupo. Se você pagou a conta do jantar por todos, registre a despesa com rateio e o WeFinance mostra quanto cada pessoa deve a quem.',
    sections: [
      {
        title: 'Como criar um rateio',
        body: 'Ao criar uma transação de despesa, ative a opção de rateio. Você verá os membros do grupo listados — defina a porcentagem de cada um. O total deve somar 100%.',
        bullets: [
          'Divisão igual — o WeFinance pode calcular a divisão automática por membro.',
          'Divisão personalizada — defina percentuais diferentes para cada pessoa.',
          'Quem pagou não precisa ter 0% — ele pode ter participação na despesa também.',
        ],
      },
      {
        title: 'A tela de Rateios',
        body: 'A tela de Rateios consolida todas as transações com divisão do grupo. Para cada transação, você vê quem pagou, o valor total e quanto cada membro ficou responsável. Use para balancear quem deve a quem ao final do mês.',
      },
      {
        title: 'Quando usar rateios',
        body: 'Rateios são úteis em situações como:',
        bullets: [
          'Contas de casa divididas entre moradores (aluguel, luz, internet).',
          'Compras de supermercado pagas por um e divididas por todos.',
          'Viagens em grupo onde um concentra os gastos.',
          'Saídas onde alguém paga a conta e distribui entre os presentes.',
        ],
      },
    ],
    tips: [
      'Rateios não criam dívidas no WeFinance — são apenas visualizações de quem deve a quem. A liquidação ocorre fora do app.',
      'Filtre por grupo e período na tela de Rateios para ver apenas os mais recentes.',
      'Se uma transação não tem rateio, ela não aparece na tela de Rateios — apenas as transações com divisão.',
      'Use rateios junto com a perspectiva "Grupo" no Dashboard para ter a visão completa do household.',
    ],
    relatedKeys: ['transactions', 'households', 'dashboard'],
  },

  {
    key: 'profile',
    label: 'Perfil',
    iconName: 'UserCircle',
    tagline: 'Personalize sua identidade e mantenha sua conta segura.',
    description:
      'A tela de Perfil é onde você gerencia sua presença no WeFinance: foto, dados pessoais e senha. Seu perfil é compartilhado com todos os grupos dos quais você faz parte.',
    sections: [
      {
        title: 'Foto de perfil',
        body: 'Faça upload de uma foto para personalizar sua conta. Ela aparece nas listas de membros dos grupos, nos rateios e em outras interações sociais dentro do app. Formatos aceitos: JPG e PNG.',
      },
      {
        title: 'Dados pessoais',
        body: 'Você pode atualizar nome, e-mail, telefone e data de nascimento. O e-mail é usado para login — ao alterá-lo, use o novo endereço na próxima entrada. O badge no canto do perfil mostra seu papel (Administrador ou Membro) nos grupos.',
      },
      {
        title: 'Alterar senha',
        body: 'Para trocar sua senha, informe a senha atual e depois a nova (confirmada duas vezes). Não há recuperação de senha por e-mail por enquanto — guarde bem sua senha atual. A troca é feita aqui no perfil.',
      },
    ],
    tips: [
      'Use uma foto clara e reconhecível — facilita identificar contribuições nos rateios.',
      'Se você é proprietário de algum grupo, seu badge mostrará "Administrador". Membros comuns veem "Membro".',
      'Ao trocar o e-mail, você precisará usar o novo endereço no próximo login.',
      'Não há recuperação de senha por e-mail no momento — se esquecer, entre em contato com o suporte.',
    ],
    relatedKeys: ['households'],
  },
]
