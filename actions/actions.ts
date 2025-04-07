"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import {
  loanRepayments,
  loans,
  members,
  monthlyContributions,
  payments,
  settings,
} from "@/lib/db/schema";
import { useAuth } from "@clerk/nextjs";

// Validation schemas
const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dedication: z.coerce.number().min(1, "Dedication amount is required"),
});

const paymentSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  date: z.date(),
});

const loanSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  date: z.date(),
});

const loanRepaymentSchema = z.object({
  loanId: z.coerce.number().min(1, "Loan is required"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
});

const contributionSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
});

// Helper function to get the current user ID
async function getUserId() {
  const { userId } = await useAuth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

// Member actions
export async function getMembers() {
  const userId = await getUserId();

  try {
    return await db.query.members.findMany({
      where: eq(members.clerkId, userId),
      with: {
        payments: true,
        loans: {
          with: {
            repayments: true,
          },
        },
        monthlyContributions: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    throw new Error("Failed to fetch members");
  }
}

export async function getMember(id: number) {
  const userId = await getUserId();

  try {
    return await db.query.members.findFirst({
      where: and(eq(members.id, id), eq(members.clerkId, userId)),
      with: {
        payments: true,
        loans: {
          with: {
            repayments: true,
          },
        },
        monthlyContributions: true,
      },
    });
  } catch (error) {
    console.error(`Failed to fetch member with ID ${id}:`, error);
    throw new Error("Failed to fetch member");
  }
}

// Loan actions
export async function addLoan(formData: FormData) {
  const userId = await getUserId();

  const validatedFields = loanSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
    date: new Date(formData.get("date") as string),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { memberId, amount, date } = validatedFields.data;

  try {
    // Verify member belongs to current user
    const memberExists = await db.query.members.findFirst({
      where: and(eq(members.id, memberId), eq(members.clerkId, userId)),
    });

    if (!memberExists) {
      return { error: "Member not found" };
    }

    // Calculate months for repayment (amount / 500,000)
    const monthsForRepayment = Math.ceil(amount / 500000);

    // Calculate monthly repayment amount
    const monthlyRepaymentAmount = Math.ceil(amount / monthsForRepayment);

    // Determine repayment months
    const startDate = new Date(date);
    const startMonth = startDate.getMonth();
    const repaymentMonths: string[] = [];

    for (let i = 0; i < monthsForRepayment; i++) {
      const repaymentDate = new Date(startDate);
      repaymentDate.setMonth(startMonth + i);
      const monthName = repaymentDate
        .toLocaleString("en-US", { month: "long" })
        .toLowerCase();
      repaymentMonths.push(monthName);
    }

    await db.insert(loans).values([
      {
        memberId,
        amount,
        dateIssued: date.toISOString(),
        monthsForRepayment,
        monthlyRepaymentAmount,
        status: "active",
        repaymentMonths,
      },
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add loan:", error);
    return { error: "Failed to add loan" };
  }
}

export async function updateLoanRepayment(formData: FormData) {
  const userId = await getUserId();

  const validatedFields = loanRepaymentSchema.safeParse({
    loanId: formData.get("loanId"),
    month: formData.get("month"),
    amount: formData.get("amount"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { loanId, month, amount } = validatedFields.data;

  try {
    // Verify loan belongs to current user
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        member: true,
        repayments: true,
      },
    });

    if (!loan || loan.member.userId !== userId) {
      return { error: "Loan not found" };
    }

    // Check if repayment already exists
    const existingRepayment = await db.query.loanRepayments.findFirst({
      where: and(
        eq(loanRepayments.loanId, loanId),
        eq(loanRepayments.month, month)
      ),
    });

    if (existingRepayment) {
      // Update existing repayment
      await db
        .update(loanRepayments)
        .set({
          amount,
          updatedAt: new Date(),
        })
        .where(eq(loanRepayments.id, existingRepayment.id));
    } else {
      // Create new repayment
      await db.insert(loanRepayments).values({
        loanId,
        month,
        amount,
        date: new Date().toISOString(),
      });
    }

    // Check if loan is fully paid
    const totalPaid = [...loan.repayments.map((r) => r.amount), amount].reduce(
      (sum, a) => sum + a,
      0
    );

    if (totalPaid >= loan.amount && loan.status !== "paid") {
      // Update loan status to paid
      await db
        .update(loans)
        .set({
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update loan repayment:", error);
    return { error: "Failed to update loan repayment" };
  }
}

// Monthly contribution actions
export async function addMonthlyContribution(formData: FormData) {
  const userId = await getUserId();

  const validatedFields = contributionSchema.safeParse({
    memberId: formData.get("memberId"),
    month: formData.get("month"),
    amount: formData.get("amount"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { memberId, month, amount } = validatedFields.data;

  try {
    // Verify member belongs to current user
    const memberExists = await db.query.members.findFirst({
      where: and(eq(members.id, memberId), eq(members.userId, userId)),
    });

    if (!memberExists) {
      return { error: "Member not found" };
    }

    // Check if contribution already exists
    const existingContribution = await db.query.monthlyContributions.findFirst({
      where: and(
        eq(monthlyContributions.memberId, memberId),
        eq(monthlyContributions.month, month)
      ),
    });

    if (existingContribution) {
      // Update existing contribution
      await db
        .update(monthlyContributions)
        .set({
          amount,
          updatedAt: new Date(),
        })
        .where(eq(monthlyContributions.id, existingContribution.id));
    } else {
      // Create new contribution
      await db.insert(monthlyContributions).values({
        memberId,
        month,
        amount,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add monthly contribution:", error);
    return { error: "Failed to add monthly contribution" };
  }
}

// Settings actions
export async function getNextMeetingDate() {
  const userId = await getUserId();

  try {
    const setting = await db.query.settings.findFirst({
      where: eq(settings.userId, userId),
    });

    return (
      setting?.nextMeetingDate ||
      new Date(new Date().setDate(new Date().getDate() + 14))
    );
  } catch (error) {
    console.error("Failed to fetch next meeting date:", error);
    return new Date(new Date().setDate(new Date().getDate() + 14));
  }
}

export async function updateNextMeetingDate(formData: FormData) {
  const userId = await getUserId();
  const dateStr = formData.get("date") as string;

  if (!dateStr) {
    return { error: "Date is required" };
  }

  const date = new Date(dateStr);

  try {
    // Check if settings already exist
    const existingSettings = await db.query.settings.findFirst({
      where: eq(settings.userId, userId),
    });

    if (existingSettings) {
      // Update existing settings
      await db
        .update(settings)
        .set({
          nextMeetingDate: date.toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(settings.id, existingSettings.id));
    } else {
      // Create new settings
      await db.insert(settings).values({
        userId,
        nextMeetingDate: date.toISOString(),
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update next meeting date:", error);
    return { error: "Failed to update next meeting date" };
  }
}
