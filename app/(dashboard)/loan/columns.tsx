"use client";
import { AddLoanRepaymentDialog } from "@/components/LoanDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loan } from "@/types/datatypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { info } from "console";
import { create } from "domain";
import { ArrowUpDown, CreditCard, MoreHorizontal } from "lucide-react";

const allMonths = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const ColumnHelper = createColumnHelper<Loan>();

export const columns = [
  ColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <div>#{info.getValue()}</div>,
    size: 70,
  }),

  ColumnHelper.accessor("memberName", {
    header: "Member",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    size: 70,
  }),

  ColumnHelper.accessor("amount", {
    header: "Loan Amount",
    cell: (info) => (
      <div className="text-right font-medium">{info.getValue()} TZS</div>
    ),
    size: 20,
  }),
  ColumnHelper.accessor("dateIssued", {
    header: "Date Issued",
    cell: (info) => {
      const date = new Date(info.getValue());
      return <div>{date.toLocaleDateString()}</div>;
    },
    size: 120,
  }),
  ColumnHelper.accessor("monthsForRepayment", {
    header: "Months",
    cell: (info) => <div className="text-center">{info.getValue()} month</div>,
    size: 80,
  }),
  ColumnHelper.accessor("monthlyRepaymentAmount", {
    header: "Monthly",
    cell: (info) => <div className="text-right">{info.getValue()} TZS</div>,
    size: 120,
  }),
  ColumnHelper.accessor("repaymentMonths", {
    header: "Repayment Months",
    cell: (info) => {
      const months = info.getValue() as string[];
      return <div>{months.join(", ")}</div>;
    },
    size: 150,
  }),

  ...allMonths.map((month) =>
    ColumnHelper.accessor("repayments", {
      id: `repayment-${month}`,
      header: month.charAt(0).toUpperCase() + month.slice(1),
      cell: (info) => {
        const loan = info.row.original as any;
        const isScheduledMonth = loan.repaymentMonths.includes(month);

        if (!isScheduledMonth) {
          return <p className="text-center text-muted-foreground">-</p>;
        }

        const repayment = loan.repayments[month] || 0;
        const formatted = new Intl.NumberFormat("en-US").format(repayment);

        return <p className="text-right font-medium">{formatted} TZS</p>;
      },
    })
  ),

  ColumnHelper.accessor("remainingAmount", {
    header: "Remaining Amount",
    cell: (info) => (
      <div className="text-right font-medium">{info.getValue()} TZS</div>
    ),
    size: 20,
  }),
];

// export const columns2: ColumnDef<Loan>[] = [
//   {
//     accessorKey: "id",
//     header: "ID",
//     cell: ({ row }) => <div>#{row.getValue("id")}</div>,
//     size: 70,
//   },
//   {
//     accessorKey: "memberName",
//     header: "Member",
//     cell: ({ row }) => (
//       <div className="font-medium">{row.getValue("memberName")}</div>
//     ),
//     size: 200,
//   },
//   {
//     accessorKey: "amount",
//     header: "Loan Amount",
//     cell: ({ row }) => {
//       const amount = Number.parseFloat(row.getValue("amount"));
//       const formatted = new Intl.NumberFormat("en-US").format(amount);
//       return <div className="text-right font-medium">{formatted} TZS</div>;
//     },
//     size: 150,
//   },
//   {
//     accessorKey: "dateIssued",
//     header: "Date Issued",
//     cell: ({ row }) => {
//       const date = new Date(row.getValue("dateIssued"));
//       return <div>{date.toLocaleDateString()}</div>;
//     },
//     size: 120,
//   },
//   {
//     accessorKey: "monthsForRepayment",
//     header: "Months",
//     cell: ({ row }) => {
//       const months: string = row.getValue("monthsForRepayment");
//       return <div className="text-center">{months} month</div>;
//     },
//     size: 80,
//   },
//   {
//     accessorKey: "monthlyRepaymentAmount",
//     header: "Monthly",
//     cell: ({ row }) => {
//       const amount = Number.parseFloat(row.getValue("monthlyRepaymentAmount"));
//       const formatted = new Intl.NumberFormat("en-US").format(amount);
//       return <div className="text-right">{formatted} TZS</div>;
//     },
//     size: 120,
//   },
//   // Generate columns for each month
//   ...allMonths.map((month) => ({
//     id: `repayment-${month}`,
//     header: month.charAt(0).toUpperCase() + month.slice(1),
//     cell: ({ row }: any) => {
//       const loan = row.original;
//       const isScheduledMonth = loan.repaymentMonths.includes(month);

//       if (!isScheduledMonth) {
//         return <div className="text-center text-muted-foreground">-</div>;
//       }

//       const repayment = loan.repayments.find((r: any) => r.month === month);
//       const repaymentAmount = repayment ? repayment.amount : 0;
//       const isPaid = repaymentAmount >= loan.monthlyRepaymentAmount;
//       const formatted = new Intl.NumberFormat("en-US").format(repaymentAmount);

//       if (isPaid) {
//         return (
//           <div className="text-right font-medium text-green-600">
//             {formatted} TZS
//           </div>
//         );
//       } else if (repaymentAmount > 0) {
//         // Partial payment
//         return (
//           <div className="text-right font-medium text-amber-600">
//             {formatted} TZS
//           </div>
//         );
//       } else {
//         // No payment yet
//         return <div className="text-right text-muted-foreground">0 TZS</div>;
//       }
//     },
//     size: 120,
//   })),
//   {
//     accessorKey: "remainingAmount",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//         >
//           Remaining
//           <ArrowUpDown className="ml-2 h-4 w-4" />
//         </Button>
//       );
//     },
//     cell: ({ row }) => {
//       const remainingAmount = row.original.remainingAmount;
//       const formatted = new Intl.NumberFormat("en-US").format(remainingAmount);
//       return (
//         <div
//           className={`text-right font-medium ${remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}
//         >
//           {formatted} TZS
//         </div>
//       );
//     },
//     size: 150,
//   },
//   {
//     accessorKey: "status",
//     header: "Status",
//     cell: ({ row }) => {
//       const status = row.getValue("status") as string;
//       const remainingAmount = row.original.remainingAmount;

//       if (remainingAmount <= 0) {
//         return (
//           <Badge variant="default" className="bg-green-100 text-green-800">
//             Paid
//           </Badge>
//         );
//       } else if (status === "active") {
//         return <Badge variant="outline">Active</Badge>;
//       } else {
//         return <Badge variant="default">Paid</Badge>;
//       }
//     },
//     size: 100,
//   },
//   {
//     id: "actions",
//     header: "",
//     cell: ({ row }) => {
//       const loan = row.original;

//       return (
//         <div className="flex items-center justify-end gap-2">
//           <AddLoanRepaymentDialog
//             loan={loan}
//             memberName={loan.memberName}
//             trigger={
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <CreditCard className="h-4 w-4" />
//                 <span className="sr-only">Add repayment</span>
//               </Button>
//             }
//           />
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" className="h-8 w-8 p-0">
//                 <span className="sr-only">Open menu</span>
//                 <MoreHorizontal className="h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuLabel>Actions</DropdownMenuLabel>
//               <DropdownMenuItem
//                 onClick={() =>
//                   navigator.clipboard.writeText(loan.id.toString())
//                 }
//               >
//                 Copy loan ID
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem>View repayment history</DropdownMenuItem>
//               <DropdownMenuItem>Mark as paid</DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       );
//     },
//     size: 80,
//   },
// ];
