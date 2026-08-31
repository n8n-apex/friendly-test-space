import { Check, Loader2, X } from "lucide-react";
import type { Step } from "@/types/workflow";

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="w-4 text-right font-mono text-xs text-muted-foreground">
              {index + 1}
            </span>
            <span
              className={
                step.state === "pending"
                  ? "text-muted-foreground"
                  : step.state === "failed"
                    ? "text-destructive"
                    : "text-foreground"
              }
            >
              {step.label}
            </span>
          </span>
          {step.state === "done" ? (
            <span className="flex items-center gap-1 text-xs text-foreground">
              <Check className="h-3.5 w-3.5" aria-hidden /> DONE
            </span>
          ) : step.state === "active" ? (
            <span className="flex items-center gap-1 text-xs text-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> RUNNING
            </span>
          ) : step.state === "failed" ? (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <X className="h-3.5 w-3.5" aria-hidden /> FAILED
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">WAITING</span>
          )}
        </li>
      ))}
    </ul>
  );
}
