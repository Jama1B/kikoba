import { Loan } from "@/types/datatypes";
import { columns } from "./columns";
import { DataTable } from "./data-table";

async function getData(): Promise<Loan[]> {
  // Fetch data from your API here.
  return [
    {
      id: 1,
      amount: 1500000,
      memberName: "John Doe",
      clerkId: 1,
      dateIssued: "2024-06-15",
      monthsForRepayment: 3, // 1,500,000 / 500,000 = 3 months
      monthlyRepaymentAmount: 500000, // 1,500,000 / 3 = 500,000 per month
      status: "active",
      repaymentMonths: ["june", "july", "august"],
      repayments: {
        june: 500000,
        july: 500000,
      },
      remainingAmount: 500000,
    },
    {
      id: 2,
      amount: 2500000,
      memberName: "Jane Smith",
      clerkId: 2,
      dateIssued: "2024-07-01",
      monthsForRepayment: 5, // 2,500,000 / 500,000 = 5 months
      monthlyRepaymentAmount: 500000, // 2,500,000 / 5 = 500,000 per month
      status: "active",
      repaymentMonths: ["july", "august", "september", "october", "november"],
      repayments: {
        july: 500000,
      },
      remainingAmount: 2000000,
    },
  ];
}

export default async function LoanPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable<Loan, any> columns={columns} data={data} />
    </div>
  );
}
