import {
  AnyPgColumn,
  pgTable,
  uuid,
  varchar,
  timestamp,
  date as dateColumn,
  text,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const householdRoleEnum = pgEnum('household_role', ['owner', 'member']);
export const splitTypeEnum = pgEnum('split_type', ['equal', 'percent', 'fixed']);
export const accountTypeEnum = pgEnum('account_type', [
  'checking',
  'savings',
  'credit',
  'cash',
  'investment',
]);
export const categoryKindEnum = pgEnum('category_kind', [
  'expense',
  'income',
  'transfer',
]);
export const cadenceUnitEnum = pgEnum('cadence_unit', [
  'day',
  'week',
  'month',
  'year',
]);
export const subscriptionTypeEnum = pgEnum('subscription_type', [
  'expense',
  'income',
]);
export const eventActionEnum = pgEnum('event_action', [
  'create',
  'update',
  'delete',
  'reconcile',
  'import',
  'generate',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'expense',
  'transfer',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'draft',
  'cleared',
  'reconciled',
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Households ──────────────────────────────────────────────────────────────

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL').notNull(),
  defaultSplitType: splitTypeEnum('default_split_type').default('equal').notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Household Members ───────────────────────────────────────────────────────

export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: householdRoleEnum('role').default('member').notNull(),
  splitValue: decimal('split_value', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// ─── Accounts ────────────────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  institution: varchar('institution', { length: 100 }),
  balanceManual: decimal('balance_manual', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
    onDelete: 'restrict',
  }),
  name: varchar('name', { length: 100 }).notNull(),
  kind: categoryKindEnum('kind').notNull(),
  isFixed: boolean('is_fixed').default(false).notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Payees ───────────────────────────────────────────────────────────────────

export const payees = pgTable('payees', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  defaultCategoryId: uuid('default_category_id').references(
    () => categories.id,
    { onDelete: 'set null' },
  ),
  name: varchar('name', { length: 120 }).notNull(),
  regexRule: text('regex_rule'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Transactions ────────────────────────────────────────────────────────────

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: uuid('account_id')
    .references(() => accounts.id, { onDelete: 'restrict' })
    .notNull(),
  payeeId: uuid('payee_id').references(() => payees.id, { onDelete: 'set null' }),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  date: dateColumn('date').notNull(),
  status: transactionStatusEnum('status').default('cleared').notNull(),
  transferToId: uuid('transfer_to_id').references(() => accounts.id, {
    onDelete: 'set null',
  }),
  transferLinkId: uuid('transfer_link_id').references(
    (): AnyPgColumn => transactions.id,
    { onDelete: 'set null' },
  ),
  metadata: jsonb('metadata'),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Transaction Splits ───────────────────────────────────────────────────────

export const transactionSplits = pgTable('transaction_splits', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  share: decimal('share', { precision: 12, scale: 2 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: uuid('account_id')
    .references(() => accounts.id, { onDelete: 'restrict' })
    .notNull(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: subscriptionTypeEnum('type').default('expense').notNull(),
  cadenceUnit: cadenceUnitEnum('cadence_unit').notNull(),
  cadenceEvery: integer('cadence_every').default(1).notNull(),
  nextRunAt: dateColumn('next_run_at').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: eventActionEnum('action').notNull(),
  data: jsonb('data'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
});

// ─── Import Sessions ─────────────────────────────────────────────────────────

export const importSessions = pgTable('import_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .references(() => households.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: uuid('account_id')
    .references(() => accounts.id, { onDelete: 'restrict' })
    .notNull(),
  filename: varchar('filename', { length: 255 }),
  importedCount: integer('imported_count').default(0).notNull(),
  duplicateCount: integer('duplicate_count').default(0).notNull(),
  errorCount: integer('error_count').default(0).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  householdMemberships: many(householdMembers),
  accounts: many(accounts),
  transactions: many(transactions),
  transactionSplits: many(transactionSplits),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(householdMembers),
  accounts: many(accounts),
  categories: many(categories),
  payees: many(payees),
  transactions: many(transactions),
  subscriptions: many(subscriptions),
  events: many(events),
  importSessions: many(importSessions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  household: one(households, {
    fields: [subscriptions.householdId],
    references: [households.id],
  }),
  account: one(accounts, {
    fields: [subscriptions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  household: one(households, {
    fields: [events.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const importSessionsRelations = relations(importSessions, ({ one }) => ({
  household: one(households, {
    fields: [importSessions.householdId],
    references: [households.id],
  }),
  account: one(accounts, {
    fields: [importSessions.accountId],
    references: [accounts.id],
  }),
  createdBy: one(users, {
    fields: [importSessions.createdById],
    references: [users.id],
  }),
}));

export const payeesRelations = relations(payees, ({ one }) => ({
  household: one(households, {
    fields: [payees.householdId],
    references: [households.id],
  }),
  defaultCategory: one(categories, {
    fields: [payees.defaultCategoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  household: one(households, {
    fields: [categories.householdId],
    references: [households.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_children',
  }),
  children: many(categories, { relationName: 'parent_children' }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  household: one(households, {
    fields: [accounts.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  household: one(households, {
    fields: [householdMembers.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [householdMembers.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  household: one(households, {
    fields: [transactions.householdId],
    references: [households.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  payee: one(payees, {
    fields: [transactions.payeeId],
    references: [payees.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [transactions.createdById],
    references: [users.id],
  }),
  mirror: one(transactions, {
    fields: [transactions.transferLinkId],
    references: [transactions.id],
    relationName: 'transfer_mirror',
  }),
  splits: many(transactionSplits),
}));

export const transactionSplitsRelations = relations(transactionSplits, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionSplits.transactionId],
    references: [transactions.id],
  }),
  user: one(users, {
    fields: [transactionSplits.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactionSplits.categoryId],
    references: [categories.id],
  }),
}));
