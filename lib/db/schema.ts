import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
  text,
  pgEnum,
  index,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const loanStatusEnum = pgEnum("loan_status", ["active", "paid"]);

// User Table with Clerk ID
export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loan Table (now references clerkUserId)
export const loans = pgTable("loan", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  monthsForRepayment: integer("months_for_repayment").notNull(),
  status: loanStatusEnum("status").notNull().default("active"),
  takenDate: date("taken_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly Contribution Table (references clerkUserId)
export const monthlyContributions = pgTable("monthly_contribution", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  month: date("month").notNull(),
  paidAt: timestamp("paid_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Other tables remain the same as previous...

// Loan Payment Table
export const loanPayments = pgTable("loan_payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meeting Dates Table
export const meetingDates = pgTable("meeting_date", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingDate: date("meeting_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

///\/ Relations
export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
  contributions: many(monthlyContributions),
  payments: many(loanPayments),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  payments: many(loanPayments),
}));

export const monthlyContributionsRelations = relations(
  monthlyContributions,
  ({ one }) => ({
    user: one(users, {
      fields: [monthlyContributions.userId],
      references: [users.id],
    }),
  })
);

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanPayments.loanId],
    references: [loans.id],
  }),
}));
