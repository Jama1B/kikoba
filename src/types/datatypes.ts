interface Month {
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
}

export type Loan = {
  id: number;
  memberName: string;
  clerkId: number;
  amount: number;
  dateIssued: string;
  monthsForRepayment: number;
  monthlyRepaymentAmount: number;
  status: "active" | "paid" | "defaulted";
  repaymentMonths: Array<keyof Month>;
  repayments: Partial<Month>;
  remainingAmount: number;
};

export type Member = {
  id: number;
  clerkId: number;
  firstName: string;
  LastName: String;
  dateOfBirth: Date;
  phoneNumber: string;
};

export type monthlyContributions = {
  id: number;
  firstName: string;
  lastName: string;
  amount: number;
  month: string[];
  createdAt: Date;
  updatedAt: Date;
  memberId: number;
};
