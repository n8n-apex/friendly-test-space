import { useState } from "react";

export function ErrorView({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="animate-fade-up">
      <h2 className="text-lg font-medium tracking-tight">Something went wrong</h2>
      <p className="mt-2 text-sm text-foreground/55">
        The LearningSuite workflow could not be completed.
      </p>

      {message && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            className="text-xs text-foreground/45 underline-offset-4 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {showDetails ? "Hide technical details" : "Technical details"}
          </button>
          {showDetails && (
            <p className="glass-inset animate-fade-up mt-3 rounded-2xl p-4 text-xs break-words text-foreground/60">
              {message}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="mt-8 w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:w-auto"
      >
        Try again
      </button>
    </div>
  );
}
