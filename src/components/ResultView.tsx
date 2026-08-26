import { useState } from "react";
import { Check } from "lucide-react";
import type { WorkflowResult } from "@/types/workflow";

export function ResultView({
  result,
  onDone,
}: {
  result: WorkflowResult;
  onDone: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const details = result.details;
  const hasDetails =
    !!details && Object.values(details).some((value) => typeof value === "number");

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 text-sm text-foreground/70">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/8">
          <Check className="h-3.5 w-3.5" />
        </span>
        Complete
      </div>

      <h2 className="mt-5 text-xl font-medium tracking-tight">{result.agentName}</h2>

      <ul className="mt-4 space-y-1.5 text-sm text-foreground/60">
        {typeof result.fieldsProcessed === "number" && (
          <li>{result.fieldsProcessed} fields processed</li>
        )}
        {typeof result.categoriesCreated === "number" && (
          <li>{result.categoriesCreated} categories</li>
        )}
        {typeof result.formAssistantFields === "number" ? (
          <li>Form Assistant configured · {result.formAssistantFields} fields</li>
        ) : (
          <li>Form Assistant configured</li>
        )}
      </ul>

      {hasDetails && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            className="text-xs text-foreground/45 underline-offset-4 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
          {showDetails && (
            <dl className="glass-inset animate-fade-up mt-3 grid grid-cols-2 gap-y-2 rounded-2xl p-4 text-xs text-foreground/60">
              {(["created", "updated", "skipped", "unmatched"] as const).map((key) =>
                typeof details?.[key] === "number" ? (
                  <div key={key} className="flex justify-between pr-4">
                    <dt className="capitalize">{key}</dt>
                    <dd className="text-foreground/80">{details[key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:w-auto"
      >
        Done
      </button>
    </div>
  );
}
