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
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="h-3 w-3" aria-hidden />
        </span>
        {title}
      </div>

      {visible.length > 0 ? (
        <dl className="mt-4 divide-y divide-border border-t border-border text-sm">
          {visible.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          The workflow completed. It did not return machine-readable values.
        </p>
      )}

      <Button className="mt-4" size="sm" variant="outline" onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  );
}
