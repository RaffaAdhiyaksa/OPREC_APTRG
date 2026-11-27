import type { ReactNode } from "react";
import { AppBackground } from "@/components/layout/AppBackground";
import { BrandMark } from "@/components/shared/BrandMark";

/** Centered glass card on the team-photo backdrop (lab website login). */
export function AuthCard({ title, description, children, footer, topAction }: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  topAction?: ReactNode;
}) {
  return (
    <div className="relative min-h-svh">
      <AppBackground />
      <main className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {topAction && <div className="mb-5 flex justify-end">{topAction}</div>}
          <section className="glass relative overflow-hidden rounded-2xl p-7 sm:p-8">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" aria-hidden />
            <div className="flex flex-col items-center text-center">
              <BrandMark />
              <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
