import { Check } from "lucide-react";
import type { ProgressStep } from "@/types/workflow";

export function ProgressView({ steps }: { steps: ProgressStep[] }) {
  return (
    <ul className="animate-fade-up space-y-3.5">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center justify-between gap-4 text-sm">
          <span
            className={
              step.state === "pending"
                ? "text-foreground/35"
                : step.state === "active"
                  ? "text-foreground"
                  : "text-foreground/70"
            }
          >
            {step.label}
          </span>
          {step.state === "done" ? (
            <Check className="h-4 w-4 text-foreground/60" aria-label="done" />
          ) : step.state === "active" ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/70" aria-label="in progress" />
          ) : (
            <span className="h-2 w-2 rounded-full border border-foreground/20" aria-hidden />
          )}
        </li>
      ))}
    </ul>
  );
}
