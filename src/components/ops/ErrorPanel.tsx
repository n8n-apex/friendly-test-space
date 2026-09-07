import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorPanel({
  title,
  message,
  details,
  onRetry,
}: {
  title: string;
  message?: string | undefined;
  details?: string | undefined;
  onRetry: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="danger-panel animate-fade-up rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRetry} className="neo-raised rounded-xl">
          Try again
        </Button>
        {details && (
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="neo-chip rounded-xl"
          >
            {open ? "Hide details" : "Show details"}
          </Button>
        )}
      </div>

      {open && details && (
        <pre className="neo-inset mt-3 max-h-64 overflow-auto rounded-xl p-3 font-mono text-[11px] whitespace-pre-wrap break-words text-muted-foreground">
          {details}
        </pre>
      )}
    </div>
  );
}

export type WorkflowErrorState = { message: string; details?: string | undefined };

/** Normalizes any thrown value into a user-facing message + technical details. */
export function toErrorState(error: unknown, fallback: string): WorkflowErrorState {
  if (error && typeof error === "object" && "details" in error && error instanceof Error) {
    return {
      message: error.message || fallback,
      details: String((error as { details?: unknown }).details ?? ""),
    };
  }
  return {
    message: fallback,
    details: error instanceof Error ? error.message : String(error),
  };
}
