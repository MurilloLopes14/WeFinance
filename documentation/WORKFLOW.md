# Workflow de Desenvolvimento — WeFinance

## Estrutura do Repositório

```
WeFinance/
  server/           # Backend NestJS
  client/           # Frontend React + Vite
  documentation/    # Documentação do projeto
  prompt.md         # Spec para agente de front-end
```

---

## Ambientes

| Ambiente | Backend | Frontend |
|---|---|---|
| Desenvolvimento | `localhost:2951` | `localhost:5173` |
| Banco | Supabase Cloud (PostgreSQL) | — |
| Uploads | Cloudinary | — |

---

## Setup Inicial

```bash
# Backend
cd server
npm install
cp .env.example .env       # preencher DATABASE_URL, JWT_SECRET, CLOUDINARY_*
npm run db:migrate          # aplica migrations
npm run start:dev           # inicia em modo watch

# Frontend
cd client
npm install
# criar .env com VITE_API_URL=http://localhost:2951/api/v1
npm run api:update          # gera hooks Orval a partir do Swagger
npm run dev
```

---

## Banco de Dados

```bash
cd server

npm run db:generate   # gera nova migration a partir do schema.ts
npm run db:migrate    # aplica migrations pendentes no banco
npm run db:studio     # abre Drizzle Studio (UI visual)
npm run db:status     # verifica status das migrations
```

> Sempre que alterar `server/src/database/schema.ts`, rodar `db:generate` seguido de `db:migrate`.

---

## Atualização de Hooks do Frontend

Toda vez que o backend tiver novos endpoints ou DTOs alterados:

```bash
cd client
npm run api:update
```

Isso regenera todos os hooks em `client/src/api/` a partir do Swagger em `localhost:2951/docs-json`.

---

## Ferramentas

| Tipo | Ferramenta |
|---|---|
| Backend framework | NestJS 11 |
| ORM | Drizzle ORM + Drizzle Kit |
| Banco | PostgreSQL via Supabase |
| Upload | Cloudinary SDK v2 |
| Frontend | React + Vite + TypeScript |
| Geração de hooks | Orval (Swagger → React Query) |
| Formulários | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS |
| Testes | Jest + Supertest |
| Documentação API | Swagger (`/docs`) |

---

## Scripts Úteis

```bash
# Backend
npm run start:dev       # hot-reload
npm run build           # build produção
npm run test            # unit tests (Jest)
npm run test:e2e        # testes de integração
npm run lint            # ESLint + fix

# Frontend
npm run dev             # servidor Vite
npm run build           # build produção
npm run api:update      # regenera hooks Orval
npm run lint            # ESLint
```

---

## Branches

| Tipo | Prefixo | Exemplo |
|---|---|---|
| Feature | `feat/` | `feat/avatar-upload` |
| Fix | `fix/` | `fix/balance-calculation` |
| Docs | `docs/` | `docs/update-api-routes` |
| Refactor | `refactor/` | `refactor/transactions-service` |
| Release | `release/` | `release/beta-1.2` |

---

## Adicionando um Novo Módulo (Backend)

1. Criar pasta em `server/src/{modulo}/`
2. Criar `{modulo}.module.ts`, `{modulo}.service.ts`, `{modulo}.controller.ts`
3. Criar DTOs em `dto/`
4. Registrar no `AppModule`
5. Adicionar campo ao schema se necessário → `db:generate` → `db:migrate`
6. No frontend: `npm run api:update`

---

## Swagger

Disponível em desenvolvimento: `http://localhost:2951/docs`

Controlado pelas variáveis:
```env
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```
