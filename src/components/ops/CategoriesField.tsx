import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, FileText, Loader2, Plus, Database, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listCategories } from "@/lib/categories.functions";
import { categoriesQueryOptions } from "@/lib/categories.queries";

export function parseCategories(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Multi-selection box for categories.
 *
 * Two clearly separated origins:
 *  - "In Learning Suite" — the live list fetched once from the shared query.
 *  - "New from document" — anything selected that does not exist in Learning Suite yet.
 *
 * The selection is still stored/submitted as the same comma-separated string
 * the workflows expect — only the UI changed.
 */
export function CategoriesField({
  value,
  onChange,
  hint = "Existing categories load from Learning Suite. Add anything extra you found in the document.",
  id = "categories",
  disabled = false,
  disabledHint,
  documentCategories = [],
  documentLoading = false,
}: {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  id?: string;
  disabled?: boolean;
  disabledHint?: string;
  /** Categories detected inside the uploaded document / Google Doc. */
  documentCategories?: string[];
  documentLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const fetchCategories = useServerFn(listCategories);
  const { data, isPending, isFetching, isError, refetch } = useQuery(
    categoriesQueryOptions(fetchCategories),
  );

  const selected = useMemo(() => parseCategories(value), [value]);
  const suiteNames = useMemo(() => (data ?? []).map((category) => category.name), [data]);
  const documentNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...documentCategories.filter((name) => !suiteNames.includes(name)),
          ...selected.filter((name) => !suiteNames.includes(name)),
        ]),
      ),
    [documentCategories, selected, suiteNames],
  );


  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    onChange(next.join(", "));
  };

  const addDraft = () => {
    const names = parseCategories(draft).filter((name) => !selected.includes(name));
    if (names.length > 0) onChange([...selected, ...names].join(", "));
    setDraft("");
  };

  return (
    <div>
      <Label htmlFor={id}>Categories</Label>
      {disabled ? (
        <div className="neo-inset mt-1.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
          {disabledHint ?? "Add the document first."}
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="neo-inset mt-1.5 w-full justify-between rounded-xl font-normal hover:bg-transparent"
            >
              <span className="truncate text-left">
                {selected.length === 0 ? "Select categories…" : `${selected.length} selected`}
              </span>
              {isPending || isFetching ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" aria-hidden />
              ) : (
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="glass-panel w-[min(24rem,90vw)] rounded-2xl p-1.5">
            {isError ? (
              <div className="p-3 text-sm">
                <p className="text-destructive">Categories could not be loaded.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-lg"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto" role="listbox" aria-multiselectable>
                <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <Database className="h-3 w-3" aria-hidden /> In Learning Suite
                </p>
                {isPending ? (
                  <p className="px-2 py-2 text-sm text-muted-foreground">
                    Loading… this can take a few seconds.
                  </p>
                ) : suiteNames.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted-foreground">No categories yet.</p>
                ) : (
                  suiteNames.map((name) => (
                    <Option
                      key={name}
                      name={name}
                      selected={selected.includes(name)}
                      onSelect={() => toggle(name)}
                    />
                  ))
                )}

                {documentNames.length > 0 && (
                  <>
                    <p className="flex items-center gap-1.5 px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      <FileText className="h-3 w-3" aria-hidden /> New from document
                    </p>
                    {documentNames.map((name) => (
                      <Option
                        key={name}
                        name={name}
                        selected
                        onSelect={() => toggle(name)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            <div className="mt-1.5 border-t border-border/60 p-2">
              <Label htmlFor={`${id}-new`} className="text-xs text-muted-foreground">
                Add a category from the document
              </Label>
              <div className="mt-1.5 flex gap-1.5">
                <Input
                  id={`${id}-new`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDraft();
                    }
                  }}
                  placeholder="Rohdaten, Outputs"
                  className="neo-inset h-9 rounded-lg border-0 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addDraft}
                  disabled={draft.trim().length === 0}
                  className="neo-raised h-9 rounded-lg px-3"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Add category</span>
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>

      {selected.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {selected.map((category) => {
            const fromDocument = !suiteNames.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggle(category)}
                aria-label={`Remove ${category}`}
                title={fromDocument ? "New from document" : "Already in Learning Suite"}
                className={
                  "neo-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-transform hover:-translate-y-px " +
                  (fromDocument ? "text-foreground ring-1 ring-primary/25" : "text-muted-foreground")
                }
              >
                {fromDocument ? (
                  <FileText className="h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <Database className="h-3 w-3 shrink-0" aria-hidden />
                )}
                <span className="font-mono">{category}</span>
                <X className="h-3 w-3 opacity-60" aria-hidden />
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" aria-hidden /> from Learning Suite
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" aria-hidden /> new from document
          </span>
        </p>
      )}
    </div>
  );
}

function Option({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        className={
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border " +
          (selected ? "border-foreground bg-foreground text-background" : "border-border")
        }
        aria-hidden
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span className="truncate">{name}</span>
    </button>
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
      <Label>Document source</Label>
      <div
        role="radiogroup"
        aria-label="Source type"
        className="neo-inset mt-1.5 inline-flex rounded-full p-1"
      >
        {(
          [
            { value: "file", label: "Upload file" },
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
              "rounded-full px-4 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none " +
              (value === option.value
                ? "neo-raised bg-background/70 font-medium text-foreground"
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
