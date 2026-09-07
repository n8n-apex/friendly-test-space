import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ResultRow = { label: string; value: string | number | undefined };

export function ResultPanel({
  title,
  rows,
  onReset,
  resetLabel = "Run again",
}: {
  title: string;
  rows: ResultRow[];
  onReset: () => void;
  resetLabel?: string;
}) {
  const visible = rows.filter((row) => row.value !== undefined && row.value !== "");

  return (
    <div className="glass-panel animate-fade-up rounded-2xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="neo-raised flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
        {title}
      </div>

      {visible.length > 0 ? (
        <dl className="neo-inset mt-4 space-y-1 rounded-xl p-2 text-sm">
          {visible.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 px-2 py-1.5">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          The workflow finished. It did not return any values to display.
        </p>
      )}

      <Button className="neo-raised mt-4 rounded-xl" size="sm" variant="ghost" onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  );
}
