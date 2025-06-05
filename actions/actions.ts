"use server";

import { db } from "@/lib/db/drizzle";
import {
  loanPayments,
  loans,
  monthlyContributions,
  users,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { format, addMonths, differenceInMonths } from "date-fns";

export interface UserFinancialData {
  clerkUserId: string;
  name: string;
  email: string;
  totalLoans: number;
  totalPaid: number;
  remainingBalance: number;
  loansCount: number;
  lastLoanDate: Date | null;
}

// export async function getUserFinancialSummary(clerkUserId: string) {
//   const user = await db
//     .select({ id: users.id })
//     .from(users)
//     .where(eq(users.clerkUserId, clerkUserId))
//     .execute();

//   if (!user[0]) return { totalLoans: 0, totalContributions: 0 };

//   const [loansResult, contributionsResult] = await Promise.all([
//     db
//       .select({ total: sql<string>`sum(${loans.amount})` })
//       .from(loans)
//       .where(eq(loans.userId, user[0].id)),

//     db
//       .select({ total: sql<string>`sum(${monthlyContributions.amount})` })
//       .from(monthlyContributions)
//       .where(eq(monthlyContributions.userId, user[0].id)),
//   ]);

//   return {
//     totalLoans: parseFloat(loansResult[0]?.total || "0"),
//     totalContributions: parseFloat(contributionsResult[0]?.total || "0"),
//   };
// }

export async function getUserFinancialSummary(clerkUserId: string) {
  const userWithRelations = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkUserId, clerkUserId),
    with: {
      loans: true,
      contributions: true,
    },
  });

  if (!userWithRelations) return { totalLoans: 0, totalContributions: 0 };

  const totalLoans = userWithRelations.loans.reduce(
    (sum, loan) => sum + parseFloat(loan.amount),
    0
  );

  const totalContributions = userWithRelations.contributions.reduce(
    (sum, contribution) => sum + parseFloat(contribution.amount),
    0
  );

  return {
    totalLoans,
    totalContributions,
  };
}

export async function getUsersWithLoanData() {
  const result = await db
    .select({
      clerkUserId: users.clerkUserId,
      name: users.name,
      email: users.email,
      totalLoans: sql<number>`COALESCE(SUM(${loans.amount}), 0)`,
      totalPaid: sql<number>`COALESCE(SUM(${loanPayments.amount}), 0)`,
      loansCount: sql<number>`COUNT(DISTINCT ${loans.id})`,
      lastLoanDate: sql<Date>`MAX(${loans.takenDate})`,
    })
    .from(users)
    .leftJoin(loans, eq(users.id, loans.userId))
    .leftJoin(loanPayments, eq(loans.id, loanPayments.loanId))
    .groupBy(users.id, users.clerkUserId, users.name, users.email)
    .execute();

  return result.map((row) => ({
    ...row,
    totalLoans: parseFloat(row.totalLoans.toString()),
    totalPaid: parseFloat(row.totalPaid.toString()),
    remainingBalance:
      parseFloat(row.totalLoans.toString()) -
      parseFloat(row.totalPaid.toString()),
    lastLoanDate: row.lastLoanDate ? new Date(row.lastLoanDate) : null,
  })) as UserFinancialData[];
}

export async function getAllLoansWithPayments() {
  const allLoans = await db.query.loans.findMany({
    with: {
      payments: true,
      user: true,
    },
    orderBy: (loans, { desc }) => [desc(loans.takenDate)],
  });

  return allLoans.map((loan) => {
    const totalPaid = loan.payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    // Calculate repayment duration based on payments
    const paymentMonths = loan.payments.map((p) => p.paidAt);
    const lastPaymentMonth =
      paymentMonths.length > 0
        ? Math.max(...paymentMonths.map((d) => d.getTime()))
        : loan.takenDate;

    // Estimate repayment duration as 3 months if no payments exist
    const monthsForRepayment =
      paymentMonths.length > 0
        ? differenceInMonths(lastPaymentMonth, loan.takenDate) + 1
        : 3;

    // Generate repayment months array
    const repaymentMonths = Array.from({ length: monthsForRepayment }, (_, i) =>
      format(addMonths(loan.takenDate, i), "MMMM").toLowerCase()
    );

    // Create repayments object
    const repayments = loan.payments.reduce(
      (acc, payment) => {
        const month = format(payment.paidAt, "MMMM").toLowerCase();
        const amount = parseFloat(payment.amount);
        acc[month] = (acc[month] || 0) + amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      id: loan.id,
      amount: parseFloat(loan.amount),
      memberName: loan.user.name,
      clerkId: loan.user.clerkUserId,
      dateIssued: format(loan.takenDate, "yyyy-MM-dd"),
      monthsForRepayment,
      monthlyRepaymentAmount: Math.round(
        parseFloat(loan.amount) / monthsForRepayment
      ),
      status: loan.status,
      repaymentMonths,
      repayments,
      remainingAmount: parseFloat(loan.amount) - totalPaid,
    };
  });
}
// export async function getAllContributions() {
//   const allContributions = await db.query.monthlyContributions.findMany({
//     with: {
//       user: true,
//     },
//     orderBy: (monthlyContributions, { desc }) => [
//       desc(monthlyContributions.createdAt),
//     ],
//   });

//   return allContributions.map((contribution) => ({
//     id: contribution.id,
//     amount: parseFloat(contribution.amount),
//     memberName: contribution.user.name,
//     clerkId: contribution.user.clerkUserId,
//     month: format(contribution.month, "MMMM").toLowerCase(),
//     createdAt: format(contribution.createdAt, "yyyy-MM-dd"),
//   }));
// }
