import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  json,
  date,
} from "drizzle-orm/pg-core";

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  dedication: integer("dedication").notNull(),
  clerkId: varchar("clerk_Id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  amount: integer("amount").notNull(),
  dateIssued: date("date_issued").notNull(),
  monthsForRepayment: integer("months_for_repayment").notNull(),
  monthlyRepaymentAmount: integer("monthly_repayment_amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  repaymentMonths: json("repayment_months").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loan repayments table
export const loanRepayments = pgTable("loan_repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull(),
  month: varchar("month", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly contributions table
export const monthlyContributions = pgTable("monthly_contributions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  month: varchar("month", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  nextMeetingDate: date("next_meeting_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const loansRelations = relations(loans, ({ one, many }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  repayments: many(loanRepayments),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanRepayments.loanId],
    references: [loans.id],
  }),
}));

export const monthlyContributionsRelations = relations(
  monthlyContributions,
  ({ one }) => ({
    member: one(members, {
      fields: [monthlyContributions.memberId],
      references: [members.id],
    }),
  })
);
