import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";

  const [incomes, expenses, budgets, savingsGoals, investments, vacations, recurringExpenses] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.vacation.findMany({ where: { userId } }),
    prisma.recurringExpense.findMany({ where: { userId } }),
  ]);

  if (format === "json") {
    const data = { incomes, expenses, budgets, savingsGoals, investments, vacations, recurringExpenses, exportedAt: new Date().toISOString() };
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="finance-export-${Date.now()}.json"`,
      },
    });
  }

  // CSV: export expenses as the primary transaction ledger, since it's the
  // most granular / commonly needed export for spreadsheets.
  const csv = toCsv(
    expenses.map((e) => ({
      date: e.date.toISOString().slice(0, 10),
      category: e.category,
      subcategory: e.subcategory ?? "",
      amount: e.amount,
      description: e.description ?? "",
      paymentMethod: e.paymentMethod,
      isRecurring: e.isRecurring,
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-export-${Date.now()}.csv"`,
    },
  });
}
