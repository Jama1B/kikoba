"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateLoanRepayment } from "@/actions/actions";

interface AddLoanRepaymentDialogProps {
  loan: any;
  memberName: string;
  trigger?: React.ReactNode;
}

interface FormValues {
  month: string;
  amount: string;
}

export function AddLoanRepaymentDialog({
  loan,
  memberName,
  trigger,
}: AddLoanRepaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate these values once to avoid recalculation on every render
  const totalPaid = loan.repayments.reduce(
    (sum: number, repayment: any) => sum + repayment.amount,
    0
  );
  const remainingAmount = loan.amount - totalPaid;

  // Filter only the months that are in the repayment schedule
  const availableMonths = loan.repaymentMonths.map((month: string) => {
    const repayment = loan.repayments.find((r: any) => r.month === month);
    return {
      label: month.charAt(0).toUpperCase() + month.slice(1),
      value: month,
      isPaid: repayment && repayment.amount >= loan.monthlyRepaymentAmount,
    };
  });

  const form = useForm<FormValues>({
    defaultValues: {
      month: "",
      amount: loan.monthlyRepaymentAmount.toString(),
    },
  });

  // Use a ref to track if we've already updated the amount for the current month
  const selectedMonthRef = useRef<string | null>(null);

  // Update amount when month changes, but only once per month selection
  useEffect(() => {
    const selectedMonth = form.watch("month");

    // Only update if the month has changed
    if (selectedMonth && selectedMonth !== selectedMonthRef.current) {
      selectedMonthRef.current = selectedMonth;

      const existingRepayment = loan.repayments.find(
        (r: any) => r.month === selectedMonth
      );
      const existingPayment = existingRepayment ? existingRepayment.amount : 0;
      const remainingForMonth = loan.monthlyRepaymentAmount - existingPayment;

      if (remainingForMonth > 0) {
        form.setValue("amount", remainingForMonth.toString());
      } else {
        form.setValue("amount", "0");
      }
    }
  }, [form.watch("month"), loan.repayments, loan.monthlyRepaymentAmount, form]);

  async function onSubmit(data: FormValues) {
    if (!data.month || !data.amount) {
      toast("Error", {
        description: "Please fill in all fields",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("loanId", loan.id.toString());
    formData.append("month", data.month);
    formData.append("amount", data.amount);

    const result = await updateLoanRepayment(formData);

    setIsSubmitting(false);

    if (result.error) {
      toast.error("Error", {
        description:
          typeof result.error === "string"
            ? result.error
            : "Failed to record repayment",
      });
    } else {
      const amount = Number.parseFloat(data.amount);

      toast.success("Repayment Recorded", {
        description: `Repayment of ${amount.toLocaleString()} TZS has been recorded for ${memberName}.`,
      });

      // Reset form and ref
      selectedMonthRef.current = null;
      form.reset({
        month: "",
        amount: loan.monthlyRepaymentAmount.toString(),
      });
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Reset the ref when dialog opens/closes
        if (!newOpen) {
          selectedMonthRef.current = null;
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        {trigger || <Button variant="default">Record Repayment</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Loan Repayment</DialogTitle>
          <DialogDescription>
            Record a loan repayment for {memberName}. The standard monthly
            repayment is {loan.monthlyRepaymentAmount.toLocaleString()} TZS.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Alert
            className={
              remainingAmount <= 0
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }
          >
            <AlertCircle
              className={
                remainingAmount <= 0 ? "text-green-600" : "text-blue-600"
              }
            />
            <AlertTitle
              className={
                remainingAmount <= 0 ? "text-green-600" : "text-blue-600"
              }
            >
              {remainingAmount <= 0 ? "Loan Fully Paid" : "Loan Status"}
            </AlertTitle>
            <AlertDescription className="text-sm">
              <div className="flex justify-between">
                <span>Total loan amount:</span>
                <span className="font-medium">
                  {loan.amount.toLocaleString()} TZS
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total paid so far:</span>
                <span className="font-medium">
                  {totalPaid.toLocaleString()} TZS
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Remaining amount:</span>
                <span
                  className={
                    remainingAmount <= 0 ? "text-green-600" : "text-blue-600"
                  }
                >
                  {remainingAmount.toLocaleString()} TZS
                </span>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Month</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {field.value
                            ? availableMonths.find(
                                (m: any) => m.value === field.value
                              )?.label
                            : "Select month..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search month..." />
                        <CommandList>
                          <CommandEmpty>No month found.</CommandEmpty>
                          <CommandGroup>
                            {availableMonths.map((m: any) => (
                              <CommandItem
                                key={m.value}
                                value={m.label}
                                onSelect={() => {
                                  form.setValue("month", m.value);
                                }}
                                disabled={m.isPaid}
                                className={
                                  m.isPaid
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <div className="flex items-center">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === m.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>{m.label}</span>
                                  {m.isPaid && (
                                    <span className="ml-2 text-xs text-green-600">
                                      (Paid)
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (TZS)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  {form.watch("month") && (
                    <FormDescription>
                      {loan.repayments.find(
                        (r: any) => r.month === form.watch("month")
                      ) ? (
                        <span>
                          Previous payment:{" "}
                          {loan.repayments
                            .find((r: any) => r.month === form.watch("month"))
                            .amount.toLocaleString()}{" "}
                          TZS
                        </span>
                      ) : (
                        <span>No previous payment for this month</span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={remainingAmount <= 0 || isSubmitting}
              >
                {isSubmitting ? "Recording..." : "Record Repayment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
