"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { updateStore, makeId } from "@/lib/local-store";
import { monthKey } from "@/lib/finance";

type FormState = {
  monthlySalary: string;
  otherIncome: string;
  rent: string;
  utilities: string;
  foodBudget: string;
  transportation: string;
  subscriptions: string;
  otherExpenses: string;
  currentSavings: string;
  currentEmergencyFund: string;
  currentInvestments: string;
  vacationGoal: string;
  vacationDate: string;
  monthlyInvestmentAmount: string;
  monthlySavingsTarget: string;
};

const initial: FormState = {
  monthlySalary: "",
  otherIncome: "",
  rent: "",
  utilities: "",
  foodBudget: "",
  transportation: "",
  subscriptions: "",
  otherExpenses: "",
  currentSavings: "",
  currentEmergencyFund: "",
  currentInvestments: "",
  vacationGoal: "",
  vacationDate: "",
  monthlyInvestmentAmount: "",
  monthlySavingsTarget: "",
};

const STEPS: { title: string; fields: (keyof FormState)[]; hint: string }[] = [
  {
    title: "Your income",
    hint: "How much do you bring in each month, in QAR?",
    fields: ["monthlySalary", "otherIncome"],
  },
  {
    title: "Essential monthly expenses",
    hint: "Rough monthly amounts are fine — you can refine these later.",
    fields: ["rent", "utilities", "foodBudget", "transportation"],
  },
  {
    title: "Other regular spending",
    hint: "Subscriptions and anything else recurring or miscellaneous.",
    fields: ["subscriptions", "otherExpenses"],
  },
  {
    title: "What you already have",
    hint: "Your current balances, so the dashboard starts accurate.",
    fields: ["currentSavings", "currentEmergencyFund", "currentInvestments"],
  },
  {
    title: "Goals",
    hint: "A vacation target and your monthly savings / investment plan.",
    fields: ["vacationGoal", "vacationDate", "monthlyInvestmentAmount", "monthlySavingsTarget"],
  },
];

const FIELD_LABELS: Record<keyof FormState, string> = {
  monthlySalary: "Monthly salary (QAR)",
  otherIncome: "Other monthly income (QAR)",
  rent: "Rent (QAR / month)",
  utilities: "Utilities — Kahramaa, internet (QAR / month)",
  foodBudget: "Food budget (QAR / month)",
  transportation: "Transportation (QAR / month)",
  subscriptions: "Subscriptions (QAR / month)",
  otherExpenses: "Other monthly expenses (QAR)",
  currentSavings: "Current savings (QAR)",
  currentEmergencyFund: "Current emergency fund (QAR)",
  currentInvestments: "Current investments (QAR)",
  vacationGoal: "Vacation savings target (QAR)",
  vacationDate: "Vacation travel date",
  monthlyInvestmentAmount: "Monthly investment amount (QAR)",
  monthlySavingsTarget: "Monthly savings target (QAR)",
};

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === STEPS.length - 1;

  function update(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const n = (key: keyof FormState) => (form[key] === "" ? 0 : Number(form[key]));
      const month = monthKey(new Date());

      updateStore((data) => {
        const incomes = data.incomes.filter((i) => i.month !== month);
        incomes.push({
          id: makeId(),
          month,
          basicSalary: n("monthlySalary"),
          allowances: 0,
          bonuses: 0,
          overtime: 0,
          otherIncome: n("otherIncome"),
        });

        const budgetEntries: [string, number][] = [
          ["Housing", n("rent") + n("utilities")],
          ["Food", n("foodBudget")],
          ["Transportation", n("transportation")],
          ["Subscriptions", n("subscriptions")],
          ["Other", n("otherExpenses")],
        ];
        const budgets = data.budgets.filter((b) => b.month !== month);
        for (const [category, amount] of budgetEntries) {
          if (amount > 0) budgets.push({ id: makeId(), month, category, amount });
        }

        const recurringExpenses = [...data.recurringExpenses];
        if (n("rent") > 0) {
          recurringExpenses.push({
            id: makeId(),
            name: "Rent",
            category: "Housing",
            amount: n("rent"),
            dayOfMonth: 1,
            paymentMethod: "Bank Transfer",
            active: true,
          });
        }

        const savingsGoals = [...data.savingsGoals];
        if (!savingsGoals.some((g) => g.name === "Emergency Fund")) {
          savingsGoals.push({
            id: makeId(),
            name: "Emergency Fund",
            targetAmount: (n("rent") + n("utilities") + n("foodBudget") + n("transportation")) * 6,
            currentAmount: n("currentEmergencyFund"),
            monthlyContribution: 0,
          });
        }
        if (!savingsGoals.some((g) => g.name === "General Savings") && (n("currentSavings") > 0 || n("monthlySavingsTarget") > 0)) {
          savingsGoals.push({
            id: makeId(),
            name: "General Savings",
            targetAmount: Math.max(n("currentSavings") * 2, n("monthlySavingsTarget") * 12, 1000),
            currentAmount: n("currentSavings"),
            monthlyContribution: n("monthlySavingsTarget"),
          });
        }

        const vacations = [...data.vacations];
        if (n("vacationGoal") > 0) {
          vacations.push({
            id: makeId(),
            destination: "My next trip",
            travelDate: form.vacationDate
              ? new Date(form.vacationDate).toISOString()
              : new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString(),
            flightCost: n("vacationGoal") * 0.35,
            hotelCost: n("vacationGoal") * 0.3,
            foodBudget: n("vacationGoal") * 0.15,
            transportation: n("vacationGoal") * 0.05,
            activities: n("vacationGoal") * 0.1,
            shopping: n("vacationGoal") * 0.05,
            buffer: 0,
            savedSoFar: 0,
          });
        }

        const investments = [...data.investments];
        if (n("currentInvestments") > 0 || n("monthlyInvestmentAmount") > 0) {
          investments.push({
            id: makeId(),
            name: "General Investments",
            category: "ETFs",
            initialAmount: n("currentInvestments"),
            monthlyContribution: n("monthlyInvestmentAmount"),
            expectedAnnualReturn: 6,
            durationYears: 10,
            feesPercent: 0,
            riskProfile: "Moderate",
          });
        }

        return { ...data, incomes, budgets, recurringExpenses, savingsGoals, vacations, investments, setupComplete: true };
      });

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    updateStore((data) => ({ ...data, setupComplete: true }));
    router.push("/");
    router.refresh();
  }

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome to Mouhib Finance</h1>
        <p className="mt-1 text-sm text-muted">Let&apos;s set up your first financial plan. All amounts are in QAR.</p>
      </div>

      <div className="mb-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-muted"}`} />
        ))}
      </div>

      <Card>
        <h2 className="text-base font-semibold text-foreground">{current.title}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{current.hint}</p>

        <div className="flex flex-col gap-4">
          {current.fields.map((field) => (
            <div key={field}>
              <Label>{FIELD_LABELS[field]}</Label>
              <Input
                type={field === "vacationDate" ? "date" : "number"}
                min={0}
                step="0.01"
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={field === "vacationDate" ? "" : "0"}
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? "Saving..." : isLast ? "Create my plan" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
