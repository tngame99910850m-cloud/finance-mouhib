import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
            ر.ق
          </div>
          <h1 className="text-xl font-semibold text-foreground">Mouhib Finance</h1>
          <p className="mt-1 text-sm text-muted">Personal finance for Qatar, in QAR.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
