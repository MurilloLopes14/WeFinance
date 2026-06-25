# WeFinance

Plataforma de gestão financeira compartilhada para grupos (casais, famílias). Controle de receitas, despesas, transferências, assinaturas recorrentes e relatórios por perspectiva pessoal e do grupo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11 + Drizzle ORM |
| Banco | PostgreSQL (Supabase) |
| Frontend | React + Vite + TypeScript |
| Hooks de API | Orval (gerado do Swagger) |
| Upload | Cloudinary |

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) (PostgreSQL)
- Conta no [Cloudinary](https://cloudinary.com) (opcional, necessário para avatares)

---

## Setup

### Backend

```bash
cd server
npm install

# Copiar e preencher variáveis de ambiente
cp .env.example .env

# Aplicar migrations
npm run db:migrate

# Iniciar em modo desenvolvimento
npm run start:dev
```

API disponível em `http://localhost:2951/api/v1`  
Swagger em `http://localhost:2951/docs`

### Frontend

```bash
cd client
npm install

# Criar arquivo de ambiente
echo "VITE_API_URL=http://localhost:2951/api/v1" > .env

# Gerar hooks de API a partir do Swagger
npm run api:update

# Iniciar
npm run dev
```

Frontend em `http://localhost:5173`

---

## Variáveis de Ambiente (Backend)

```env
# Servidor
PORT=2951
NODE_ENV=development

# Banco
DATABASE_URL=postgres://user:password@host:5432/db

# JWT
JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=sua-chave-refresh
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary (avatares)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
CLOUDINARY_ROOT_FOLDER=weFinance
```

---

## Scripts

```bash
# Backend (cd server)
npm run start:dev      # desenvolvimento com hot-reload
npm run build          # build de produção
npm run test           # testes unitários
npm run db:generate    # gera migration a partir do schema
npm run db:migrate     # aplica migrations
npm run db:studio      # UI visual do banco

# Frontend (cd client)
npm run dev            # servidor de desenvolvimento
npm run build          # build de produção
npm run api:update     # regenera hooks Orval do Swagger
```

---

## Funcionalidades Implementadas

### Autenticação e Usuários
- Autenticação JWT com refresh token e logout seguro
- Perfil do usuário com avatar via Cloudinary
- Sistema de onboarding guiado: estado de tours por tela persistido em JSONB (`GET /users/me`, `PATCH /users/me/onboarding`)

### Grupos e Membros
- Grupos compartilhados (households) com código de convite
- Roles: owner e member
- Customização de cor por grupo

### Contas Financeiras
- Contas dos tipos: corrente, poupança, crédito, carteira e investimento
- Saldo calculado automaticamente por transação
- Customização de cor por conta

### Categorias
- Hierárquicas (categoria pai / subcategoria)
- Tipos: expense, income, transfer
- Campo `isFixed` para categorias de gasto fixo
- Customização de cor por categoria

### Transações
- Despesas, receitas e transferências espelhadas
- Rateio entre membros (splits): igual, percentual ou valor fixo
- Importação de transações via CSV com deduplicação por hash

### Assinaturas Recorrentes
- Despesas e receitas recorrentes (salários, aluguéis, etc.)
- Execução automática via cron diário
- Campo `type`: expense ou income

### Dashboard e Insights
- KPIs de gastos e receitas do mês
- Donut de categorias, calendário financeiro, evolução diária
- 10 regras de insights financeiros automáticos (geração mensal)

### Infraestrutura
- Auditoria completa de ações (events)
- Documentação Swagger completa
- Migrations gerenciadas pelo Drizzle Kit

---

## Estrutura

```
WeFinance/
  server/           # NestJS API
    src/
      auth/
      users/
      households/
      accounts/
      categories/
      transactions/
      subscriptions/
      insights/
      events/
      imports/
      upload/       # Cloudinary
      database/     # Schema + Drizzle config
    drizzle/        # Migrations
  client/           # React Frontend
    src/
      api/          # Hooks gerados pelo Orval
      components/
      pages/
      hooks/
      router/
  documentation/    # Docs do projeto
```

---

## Documentação

| Arquivo | Descrição |
|---|---|
| [VISION.md](documentation/VISION.md) | Visão do produto e roadmap |
| [SCHEMA.md](documentation/SCHEMA.md) | Estrutura do banco de dados |
| [API ROUTES.md](documentation/API%20ROUTES.md) | Endpoints da API |
| [BUSINESS RULES.md](documentation/BUSINESS%20RULES.md) | Regras de negócio |
| [FRONT STRUCTURE.md](documentation/FRONT%20STRUCTURE.md) | Estrutura do frontend |
| [WORKFLOW.md](documentation/WORKFLOW.md) | Fluxo de desenvolvimento |
| [MOBILE NOTES.md](documentation/MOBILE%20NOTES.md) | Planejamento do app mobile |
