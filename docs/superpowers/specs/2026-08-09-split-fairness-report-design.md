# Split Fairness Report — Design Spec

**Date:** 2026-08-09
**Status:** Approved

---

## Overview

A new report endpoint that shows how equitably household expenses are shared between members. It answers "who paid what vs who was supposed to pay what" over a given period, accounting for explicit per-transaction splits and inter-member settlement transfers.

---

## Endpoint

```
GET /households/:id/transactions/report/split-fairness
```

**Query parameters:**

| Param   | Type     | Description                                          |
|---------|----------|------------------------------------------------------|
| `month` | `YYYY-MM`| Shorthand for the full month; derives `from`/`to`    |
| `from`  | `YYYY-MM-DD` | Period start (inclusive)                         |
| `to`    | `YYYY-MM-DD` | Period end (inclusive)                           |

Rules:
- `month` and `from`/`to` are mutually exclusive — `month` wins if both are provided.
- If neither is provided, defaults to the current month.
- Requires household membership (`assertMember`).

---

## Response Shape

```typescript
SplitFairnessResponseDto {
  period: {
    from: string   // YYYY-MM-DD
    to: string     // YYYY-MM-DD
  }

  totalHouseholdExpenses: number   // sum of all non-draft expenses in period

  members: MemberFairnessDto[]

  suggestedSettlements: SuggestedSettlementDto[]

  unsplitTransactionCount: number  // expense transactions with no split records
}

MemberFairnessDto {
  userId: string
  name: string
  avatarUrl: string | null

  // ── Agreed-split view ───────────────────────────────────────────────
  agreedSplitPercent: number     // For "percent" split: householdMembers.splitValue
                                  // For "equal" split: 100 / memberCount
  expectedAmount: number         // agreedSplitPercent% of totalHouseholdExpenses
  actualPaid: number             // sum of non-draft expenses from their accounts
  settlementsReceived: number    // transfers received FROM other household members
  settlementsPaid: number        // transfers sent TO other household members
  netBalance: number             // actualPaid + settlementsPaid - settlementsReceived - expectedAmount
                                  // positive = overpaid (owed money by household)
                                  // negative = underpaid (owes money to household)

  // ── Explicit-split view ─────────────────────────────────────────────
  // Only considers transactions that have at least one transaction_split record
  explicitSplitPaid: number      // total paid by their accounts on split transactions
  explicitSplitAssigned: number  // sum of transaction_splits.share assigned to them
  explicitSplitBalance: number   // explicitSplitPaid - explicitSplitAssigned
                                  // positive = overpaid on explicit splits
                                  // negative = underpaid on explicit splits
}

SuggestedSettlementDto {
  fromUserId: string     // debtor (netBalance < 0)
  fromUserName: string
  toUserId: string       // creditor (netBalance > 0)
  toUserName: string
  amount: number
}
```

---

## DB Queries (all run in parallel)

**1. Members + household split type**
Fetch all household members joined with users: `userId`, `splitValue`, `name`, `avatarUrl`. Also fetch `households.defaultSplitType`.

**2. Expenses paid per member**
Sum non-draft `expense` transactions in the period, grouped by `account.userId`. Join `transactions → accounts`.

**3. Settlements between members**
Sum `transfer` transactions in the period where `fromAccount.userId` and `toAccount.userId` are both household members AND they are different users. Group by `(fromAccount.userId, toAccount.userId)`. Join `transactions` to accounts twice (source and destination).

**4. Explicit split assignments**
Sum `transaction_splits.share` grouped by `userId`, joining to `transactions` to apply the period date filter.

**5. Explicit split paid**
Sum transaction amounts on expense transactions that have at least one `transaction_splits` record, grouped by `account.userId`. Join `transactions → accounts`, filter by period and existence of splits.

---

## agreedSplitPercent Derivation

```
if household.defaultSplitType === 'equal':
  agreedSplitPercent = 100 / memberCount

if household.defaultSplitType === 'percent':
  agreedSplitPercent = member.splitValue  // stored as e.g. 60 for 60%
```

---

## Suggested Settlement Algorithm

Greedy debt simplification — minimises number of transfers:

1. Separate members into creditors (`netBalance > 0`) and debtors (`netBalance < 0`).
2. Sort creditors descending, debtors ascending by absolute balance.
3. While both lists are non-empty:
   - Take the largest creditor and largest debtor.
   - Settlement amount = `min(creditor.netBalance, |debtor.netBalance|)`.
   - Emit `SuggestedSettlementDto { from: debtor, to: creditor, amount }`.
   - Reduce both balances by the settlement amount; remove if zero.

---

## Architecture

| Artifact | Location |
|---|---|
| Response DTOs | `server/src/transactions/dto/split-fairness-response.dto.ts` |
| Filter DTO | `server/src/transactions/dto/filter-split-fairness.dto.ts` |
| Service method | `TransactionReportsService.getSplitFairness()` |
| Controller endpoint | `TransactionsController` — `GET report/split-fairness` |

No new module needed. The method lives in `TransactionReportsService` alongside the other report methods, following the existing pattern.

---

## Follow-up (same PR)

After the split fairness route is implemented, add `categoryColor: string | null` to `TransactionResponseDto` so the frontend can render a colour badge on the transaction table. This requires joining `categories` in `findAll` and `findOneRaw` and selecting `categories.color`.
