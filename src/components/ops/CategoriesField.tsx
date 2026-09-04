import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listCategories } from "@/lib/categories.functions";

export function parseCategories(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Multi-selection box for Learning Suite categories.
 * The selection is stored and submitted as the same comma-separated
 * string the workflows already expect — only the UI changed.
 */
export function CategoriesField({
  value,
  onChange,
  hint = "Select one or more categories.",
  id = "categories",
}: {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const fetchCategories = useServerFn(listCategories);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["learning-suite-categories"],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60_000,
  });

  const selected = useMemo(() => parseCategories(value), [value]);
  const options = useMemo(() => {
    const names = (data ?? []).map((category) => category.name);
    const extras = selected.filter((name) => !names.includes(name));
    return [...names, ...extras];
  }, [data, selected]);

  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    onChange(next.join(", "));
  };

  return (
    <div>
      <Label htmlFor={id}>Categories</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="mt-1.5 w-full justify-between font-normal"
          >
            <span className="truncate text-left">
              {selected.length === 0
                ? "Select categories…"
                : `${selected.length} selected`}
            </span>
            {isPending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" aria-hidden />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(22rem,90vw)] p-1">
          {isError ? (
            <div className="p-3 text-sm">
              <p className="text-destructive">Categories could not be loaded.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          ) : isPending ? (
            <p className="p-3 text-sm text-muted-foreground">Loading categories…</p>
          ) : options.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No categories available.</p>
          ) : (
            <div role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
              {options.map((name) => {
                const isSelected = selected.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(name)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span
                      className={
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                        (isSelected ? "border-foreground bg-foreground text-background" : "border-border")
                      }
                      aria-hidden
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              aria-label={`Remove ${category}`}
              className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] hover:border-foreground/40"
            >
              {category}
              <X className="h-3 w-3" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


export function SourceTabs({
  value,
  onChange,
}: {
  value: "file" | "google_doc";
  onChange: (value: "file" | "google_doc") => void;
}) {
  return (
    <div>
      <Label>Source</Label>
      <div
        role="radiogroup"
        aria-label="Source type"
        className="mt-1.5 inline-flex rounded-md border border-border p-0.5"
      >
        {(
          [
            { value: "file", label: "File" },
            { value: "google_doc", label: "Google Doc" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={
              "rounded px-4 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none " +
              (value === option.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function isValidGoogleDocUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.href.startsWith("https://docs.google.com/");
  } catch {
    return false;
  }
}
