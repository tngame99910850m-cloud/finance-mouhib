"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { apiPost } from "@/lib/use-api";

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
      const payload: Record<string, number | string | null> = {};
      for (const key of Object.keys(form) as (keyof FormState)[]) {
        if (key === "vacationDate") {
          payload[key] = form[key] || null;
        } else {
          payload[key] = form[key] === "" ? 0 : Number(form[key]);
        }
      }
      await apiPost("/api/setup", payload);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    await apiPost("/api/setup/skip", {});
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
