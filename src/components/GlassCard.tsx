import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel animate-fade-up rounded-[24px] p-6 sm:p-9 transition-transform duration-500 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[13px] font-medium tracking-tight text-foreground/70"
    >
      {children}
    </label>
  );
}
