# Finanças a Dois

## 🎯 Visão Geral

O **Finanças a Dois** é um sistema de **gestão financeira compartilhada** projetado para casais (ou duplas) que desejam ter **transparência, controle e planejamento** sobre seus gastos e economias. O objetivo principal é permitir que duas pessoas acompanhem juntas suas finanças pessoais e conjuntas de forma simples e acessível, tanto via web quanto aplicativo móvel.

A filosofia do projeto é unir **inteligência financeira com empatia de relacionamento** — cada decisão de gasto e economia é uma construção conjunta. 💑

---

## 🌟 Objetivos Principais

1. **Controle compartilhado de finanças** (entradas, saídas, assinaturas e poupanças);
    
2. **Planejamento e metas financeiras** a curto e médio prazo;
    
3. **Relatórios claros e intuitivos**, com filtros por pessoa e categoria;
    
4. **Importação automática de dados bancários** (CSV/OFX);
    
5. **Futuro mobile-first** com sincronização offline via React Native;
    
6. **Privacidade e autonomia** – cada pessoa tem seu próprio login e visibilidade parcial dos dados, conforme o combinado no grupo.
    

---

## 🧱 Stack Tecnológica

|Camada|Tecnologia|Observação|
|---|---|---|
|**Backend**|NestJS|Estrutura modular, escalável e segura|
|**Banco de Dados**|PostgreSQL (Supabase)|Estrutura SQL relacional e gratuita no plano inicial|
|**ORM**|Drizzle ORM|ORM TypeScript-first leve com suporte a migrations e performance superior|
|**Frontend Web**|React + Vite + Tailwind|Interface leve e reativa|
|**Mobile**|React Native (Expo)|Sincronização offline + experiência nativa|
|**Infra**|Docker Compose|Facilita desenvolvimento local|

---

## ⚙️ Funcionalidades do MVP

1. **Autenticação e grupos compartilhados** (usuário + parceiro[a]);
    
2. **Contas financeiras** (banco, cartão, poupança, investimento);
    
3. **Transações manuais** (despesas, receitas, transferências);
    
4. **Rateio de valores** entre os membros do casal (50/50, percentual, valor fixo);
    
5. **Categorias** com hierarquia e tipos (Receita, Despesa, Transferência);
    
6. **Assinaturas / Despesas recorrentes** (Netflix, Spotify, etc.);
    
7. **Importação CSV básica** para lançar transações em lote;
    
8. **Relatórios resumidos** (total de receitas/despesas, top categorias, saldo mensal);
    
9. **Trilha de auditoria (events)** para registrar cada modificação relevante.
    

_(Funcionalidades como budgets, metas e OCR serão reservadas para fases futuras.)_

---

## 💡 Princípios do Projeto

1. **Simplicidade de uso:** foco em poucos cliques e interface limpa;
    
2. **Transparência:** cada pessoa visualiza seus dados e os compartilhados de forma clara;
    
3. **Confiabilidade:** toda alteração é rastreável (event sourcing);
    
4. **Escalabilidade:** código modular e banco preparado para futuras expansões;
    
5. **Controle manual e automático:** o sistema permite importação de dados, mas nunca impõe regras sem confirmação do usuário.
    

---

## 🔮 Roadmap de Evolução

| Fase         | Objetivo     | Entregas principais                                                 |
| ------------ | ------------ | ------------------------------------------------------------------- |
| **MVP (M1)** | Fundamentos  | Auth, Households, Accounts, Transactions, Categories, Subscriptions |
| **M2**       | Planejamento | Budgets, Relatórios avançados, Exportações                          |
| **M3**       | Mobile       | Aplicativo React Native + Sync offline                              |
| **M4**       | Automação    | Importador OFX/CSV com IA e OCR para notas fiscais                  |

---

## 🔐 Segurança e Privacidade

- **JWT** para autenticação e refresh tokens;
    
- Cada requisição escopada por `household_id`;
    
- Permissões de leitura/escrita com base em papéis (`owner`, `member`);
    
- Senhas criptografadas com bcrypt;
    
- Logs e auditorias gravadas em `events`.
    

---

## 📈 Métricas Futuras (fase M2+)

- Evolução do saldo consolidado (gráfico de linha);
    
- Top categorias mensais;
    
- Gastos fixos vs variáveis;
    
- Taxa de poupança = (Receitas - Despesas) / Receitas.
    

---

## 🚀 Missão

Transformar o controle financeiro em um **ato de parceria**, onde transparência e colaboração fortalecem tanto o planejamento quanto o relacionamento.

---

### ➕ Próximos passos

1. Criar o arquivo `SCHEMA.md` com a estrutura das tabelas PostgreSQL (Supabase);
    
2. Em seguida, documentar `BUSINESS_RULES.md` com as lógicas determinísticas de cálculo, rateio e recorrência.