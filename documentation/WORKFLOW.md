# Ciclo de Desenvolvimento e Entrega

## ⚙️ Visão Geral

O **Finanças a Dois** segue um fluxo de desenvolvimento **iterativo e versionado**, com entregas progressivas e documentação contínua.

A abordagem será dividida em **fases (MVP → M1 → M2 → M3)**, cada uma contendo objetivos claros, módulos previstos e tarefas práticas, permitindo um acompanhamento granular e colaborativo — inclusive com o agente GPT do projeto.

---

## 🧭 1. Estrutura de Fases

|Fase|Nome|Objetivo|Entregas principais|
|---|---|---|---|
|**MVP (M1)**|Fundamentos|Estrutura principal e fluxos essenciais|Auth, Households, Accounts, Categories, Transactions, Subscriptions|
|**M2**|Planejamento|Orçamentos e relatórios avançados|Budgets, Reports, Auditing|
|**M3**|Mobile|Aplicativo Expo com sync offline|RN app, SQLite, Sync Layer|
|**M4**|Automação|IA e OCR para leitura de notas|Importação inteligente, metas, recomendações|

---

## 🧩 2. Módulos do Projeto

|Módulo|Stack|Descrição|
|---|---|---|
|**server**|NestJS + Drizzle ORM|Backend principal e API REST|
|**web**|React + Vite + Tailwind|Painel web e interface principal|
|**mobile**|React Native + Expo|App com sincronização offline|
|**schemas**|TypeScript (Zod)|Tipos compartilhados entre apps|
|**ui**|React Components|Biblioteca de componentes reutilizáveis|
|**docker**|Docker Compose|Infra local (PostgreSQL + pgAdmin)|

---

## 🧱 3. Estrutura de Repositório

`financas-a-dois/   apps/     server/     web/     mobile/   packages/     schemas/     ui/   docker/   docs/     VISION.md     SCHEMA.md     BUSINESS_RULES.md     API_ROUTES.md     FRONT_STRUCTURE.md     MOBILE_NOTES.md     WORKFLOW.md     PROMPT.md   .env.example   docker-compose.yml   README.md`

---

## 🧰 4. Ferramentas de Suporte

|Tipo|Ferramenta|Uso|
|---|---|---|
|Banco|**Supabase (PostgreSQL)**|DB em cloud, migrations automáticas|
|ORM|**Drizzle ORM**|Schema definitions e migrations via Drizzle Kit|
|Versionamento|**Git + GitHub**|Branches por feature|
|Documentação|**Markdown + GPT Project**|Iteração e versionamento inteligente|
|Testes|**Jest + Supertest**|Unitários e integração|
|Infra local|**Docker Compose**|PostgreSQL + pgAdmin|
|CI/CD (futuro)|**GitHub Actions**|Lint, Test, Build, Deploy|

---

## 🚀 5. Etapas de Desenvolvimento

### 🔹 Etapa 1 – Inicialização do Projeto

**Objetivo:** preparar ambiente, stack e conexão com Supabase.

`# Clonar repo git clone https://github.com/user/financas-a-dois.git  # Instalar dependências npm install  # Subir containers locais docker compose up -d`

- Configurar `.env` com `DATABASE_URL` e `JWT_SECRET`.
    
- Rodar migrations iniciais.
    
- Validar conexão com Supabase (API + DB Studio).
    

---

### 🔹 Etapa 2 – Backend (NestJS)

**Objetivo:** implementar API principal.

Módulos nesta ordem:

1. `auth`
    
2. `households`
    
3. `accounts`
    
4. `categories`
    
5. `transactions`
    
6. `subscriptions`
    
7. `imports`
    
8. `events`
    

**Checklist:**

- Criar DTOs com `class-validator`;
    
- Testar transferência espelhada e rateio;
    
- Swagger habilitado em `/docs`;
    
- Criar seed básico (`owner + household default`).
    

---

### 🔹 Etapa 3 – Front-End (React)

**Objetivo:** criar interface funcional e consistente.

- Estrutura de páginas (`Dashboard`, `Transactions`, `Subscriptions`, `Reports`);
    
- React Query conectado ao backend;
    
- Tailwind + layout unificado;
    
- Toasts para feedbacks;
    
- Autenticação persistente com JWT.
    

---

### 🔹 Etapa 4 – Mobile (React Native)

**Objetivo:** construir app offline-first.

- Auth + persistência via SecureStore;
    
- Dashboard e transações básicas;
    
- Fila de mutações (`pending_mutations`);
    
- Sincronização online → API NestJS.
    

---

### 🔹 Etapa 5 – Testes e Auditoria

**Objetivo:** garantir consistência e confiabilidade.

- Unit tests: rateio, reconciliação e assinaturas.
    
- Integration tests: CRUD transactions.
    
- Auditoria ativa via `events`.
    

---

## 🧮 6. Pipelines (CI/CD)

### CI Básico (GitHub Actions)

`name: CI on: [push, pull_request]  jobs:   build:     runs-on: ubuntu-latest     steps:       - uses: actions/checkout@v3       - uses: actions/setup-node@v4         with:           node-version: 20       - run: npm ci       - run: npm run lint       - run: npm test`

### Deploy (futuro)

- Backend: **Render** ou **Railway.app**
    
- Web: **Vercel**
    
- Mobile: **Expo EAS Build**
    
- Banco: **Supabase Cloud**
    

---

## 🧾 7. Scripts e Comandos Úteis

`// package.json (root) {   "scripts": {     "dev:server": "cd apps/server && npm run start:dev",     "dev:web": "cd apps/web && npm run dev",     "dev:mobile": "cd apps/mobile && npm run start",     "test": "jest --runInBand",     "migrate": "cd apps/server && npm run typeorm migration:run",     "lint": "eslint . --ext .ts,.tsx",     "format": "prettier --write ."   } }`

---

## 🔁 8. Workflow de Branches

|Tipo|Prefixo|Exemplo|
|---|---|---|
|Feature|`feat/`|`feat/transactions-module`|
|Fix|`fix/`|`fix/split-calculation`|
|Docs|`docs/`|`docs/update-schema`|
|Refactor|`refactor/`|`refactor/auth-service`|
|Release|`release/`|`release/v1.0.0`|

---

## 🧩 9. Integração com GPT Project

Cada etapa de desenvolvimento será documentada e acompanhada pelo agente GPT configurado via `PROMPT.md`.  
A estrutura de automação será:

`docs/ → GPT lê (Vision, Schema, Rules, API, etc.) ↓ Project Prompt → Executa task (ex: gerar módulo Transactions) ↓ Output → PR automático ou patch aplicado manualmente`

---

## 📅 10. Roadmap Resumido

|Mês|Marco|Entrega|
|---|---|---|
|**Out 2025**|Setup + MVP Backend|Auth + Transactions funcionando|
|**Nov 2025**|Web Interface|Dashboard + Lançamentos|
|**Dez 2025**|Mobile MVP|App Expo com sync básico|
|**Jan 2026**|Relatórios e Budgets|Relatórios completos e UI refinada|

---

## 🧭 11. Filosofia de Desenvolvimento

> “Desenvolver com propósito, clareza e previsibilidade.  
> Cada linha deve ter sentido, cada regra deve refletir um valor real.”

O Finanças a Dois não é apenas um software, mas um **projeto de organização compartilhada e confiança mútua**.  
Cada commit é uma pequena evolução dessa parceria.