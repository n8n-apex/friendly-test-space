import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorPanel({
  title,
  onRetry,
}: {
  title: string;
  message?: string | undefined;
  details?: string | undefined;
  onRetry: () => void;
}) {
  return (
    <div className="danger-panel animate-fade-up rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">An error occurred. Please try again.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRetry} className="neo-raised rounded-xl">
          Try again
        </Button>
      </div>
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
