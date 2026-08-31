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
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRetry}>
          Try Again
        </Button>
        {details && (
          <Button size="sm" variant="outline" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Hide Technical Details" : "Technical Details"}
          </Button>
        )}
      </div>

      {open && details && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] whitespace-pre-wrap break-words text-muted-foreground">
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
    return { message: error.message || fallback, details: String((error as { details?: unknown }).details ?? "") };
  }
  return {
    message: fallback,
    details: error instanceof Error ? error.message : String(error),
  };
}
