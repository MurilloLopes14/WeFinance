# WeFinance — Visão do Produto

## Objetivo

O **WeFinance** é uma plataforma de **gestão financeira compartilhada** projetada para grupos (casais, famílias, repúblicas) que desejam ter transparência e controle conjunto sobre suas finanças. Cada membro tem sua visão pessoal e o grupo tem uma visão consolidada.

A filosofia: unir **inteligência financeira com colaboração** — cada decisão é uma construção coletiva.

---

## Objetivos Principais

1. Controle compartilhado (entradas, saídas, assinaturas, transferências);
2. Visão dual: perspectiva **pessoal** + perspectiva do **grupo**;
3. Relatórios claros por categoria, membro, evolução diária e mensal;
4. Importação automática via CSV;
5. Futuro mobile-first com sincronização offline;
6. Privacidade e autonomia por membro.

---

## Stack Tecnológica

| Camada | Tecnologia | Observação |
|---|---|---|
| **Backend** | NestJS + Drizzle ORM | Modular, TypeScript-first, migrations via Drizzle Kit |
| **Banco de Dados** | PostgreSQL (Supabase) | Cloud, gratuito no plano inicial |
| **Frontend Web** | React + Vite + TypeScript | Orval para geração de hooks React Query a partir do Swagger |
| **Upload de Mídia** | Cloudinary | Avatar de perfil dos usuários |
| **Mobile** | React Native (Expo) | Fase M3 — offline-first |

---

## Estado Atual (Beta 1.2 — Jun/2026)

### Backend — Completo ✅

| Módulo | Status | Destaques |
|---|---|---|
| Auth | ✅ | JWT + Refresh token |
| Users | ✅ | CRUD + upload de avatar via Cloudinary |
| Households | ✅ | Invite code, membros, permissões por role |
| Accounts | ✅ | Saldo automático atualizado a cada transação |
| Categories | ✅ | Hierarquia (pai/filho), isFixed com validação |
| Payees | ✅ | Favorecidos com regex para auto-categorização |
| Transactions | ✅ | Despesas, receitas, transferências espelhadas, splits |
| Transaction Splits | ✅ | Rateio por valor absoluto entre membros |
| Subscriptions | ✅ | Cron diário, expense + income (salário etc.) |
| Reports / Dashboard | ✅ | personal-summary, category-breakdown, daily-summary |
| Insights | ✅ | Regras automatizadas de análise financeira |
| Events | ✅ | Auditoria completa de todas as ações |
| Imports | ✅ | CSV com deduplicação por hash |

### Frontend Web — Em andamento 🟡

| Módulo | Status |
|---|---|
| Autenticação (login/registro) | ✅ |
| Dashboard (KPIs, calendário, donut, evolução) | 🟡 |
| Transações (listagem, criação, edição) | 🟡 |
| Categorias | ✅ |
| Contas | ✅ |
| Assinaturas | 🟡 |
| Insights | 🟡 |
| Perfil do usuário (avatar) | ⚪ |

### Mobile — Não iniciado ⚪

---

## Roadmap

| Fase | Nome | Objetivo | Status |
|---|---|---|---|
| **Beta 1.x** | Fundamentos | Backend completo + dashboard web | 🟡 Em andamento |
| **Beta 2.0** | Web Completo | Todas as telas web funcionais | ⚪ |
| **M3** | Mobile | App React Native offline-first | ⚪ |
| **M4** | Automação | Importação inteligente, OCR, IA | ⚪ |

---

## Princípios

1. **Simplicidade:** poucos cliques, interface limpa;
2. **Transparência:** dados pessoais e compartilhados claramente separados;
3. **Confiabilidade:** toda alteração rastreada em `events`;
4. **Escalabilidade:** código modular, schema preparado para extensões;
5. **Controle:** o sistema nunca impõe ações sem confirmação do usuário.
