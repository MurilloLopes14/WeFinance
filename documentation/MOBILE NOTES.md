# Mobile — WeFinance

> Status: **Fase M3 — Não iniciada**. O backend está pronto para consumo mobile.

---

## Stack Planejada

| Camada | Tecnologia |
|---|---|
| Base | Expo SDK (React Native) |
| Navegação | Expo Router |
| Estado/Cache | React Query + Zustand |
| Offline | SQLite + AsyncStorage |
| UI | NativeWind (Tailwind for RN) |
| Auth | JWT + SecureStore |
| Notificações | Expo Notifications |
| Gráficos | Victory Native |

---

## Estratégia Offline-First

O app deve funcionar **sem conexão** para operações básicas. A sincronização ocorre automaticamente ao reconectar.

1. Toda ação (criar/editar/deletar) é gravada em `pending_mutations` no SQLite local
2. Hook `useSync()` monitora status de rede
3. Ao reconectar → envia mutações pendentes à API e limpa a fila

---

## Telas Planejadas

| Tela | Descrição |
|---|---|
| `LoginScreen` | Auth com armazenamento em SecureStore |
| `DashboardScreen` | KPIs + top categorias + próximas assinaturas |
| `TransactionListScreen` | Lista paginada com filtros e FAB |
| `NewTransactionScreen` | Formulário offline-capable |
| `SubscriptionsScreen` | Lista com próximas datas e ações |
| `ReportsScreen` | Gráficos resumidos |
| `SettingsScreen` | Tema, sync, logout |

---

## Integração com Backend

O mobile consome **as mesmas rotas** documentadas em `API ROUTES.md`. Todos os endpoints estão disponíveis — o backend não precisa de adaptações para mobile.

Pontos de atenção:
- Avatar: `POST /users/me/avatar` com `multipart/form-data` — testar com `expo-image-picker`
- Refresh token: implementar interceptor Axios com `SecureStore`
- Paginação: usar `?page=1&limit=20` nas listagens

---

## Roadmap Mobile

| Etapa | Status |
|---|---|
| Setup Expo + navegação | ⚪ |
| Auth + SecureStore | ⚪ |
| Dashboard + KPIs | ⚪ |
| Transações (CRUD + offline) | ⚪ |
| Assinaturas | ⚪ |
| Sync layer | ⚪ |
| Relatórios / gráficos | ⚪ |
| Upload de avatar | ⚪ |
| Push notifications | ⚪ |
