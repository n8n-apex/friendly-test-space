import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategorySelector({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (category: string) => {
    onChange(
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  };

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="glass-input flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="flex flex-wrap items-center gap-1.5">
          {selected.length === 0 ? (
            <span className="text-foreground/40">Select categories</span>
          ) : (
            selected.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 rounded-full bg-foreground/8 px-2.5 py-1 text-xs text-foreground/80"
              >
                {category}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${category}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(category);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                      event.preventDefault();
                      toggle(category);
                    }
                  }}
                  className="cursor-pointer rounded-full text-foreground/40 transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="glass-panel animate-fade-up absolute z-20 mt-2 w-full rounded-2xl p-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            className="mb-1 w-full rounded-xl bg-transparent px-3 py-2 text-sm placeholder:text-foreground/35 focus-visible:outline-none"
          />
          <ul role="listbox" aria-multiselectable className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-foreground/40">No matches</li>
            )}
            {filtered.map((option) => {
              const active = selected.includes(option);
              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(option)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {option}
                    {active && <Check className="h-4 w-4 text-foreground/60" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
