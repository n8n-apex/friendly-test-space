import type { SourceType } from "@/types/workflow";
import { cn } from "@/lib/utils";

const options: { value: SourceType; label: string }[] = [
  { value: "google_doc", label: "Google Doc" },
  { value: "file", label: "Upload File" },
];

export function SourceSelector({
  value,
  onChange,
}: {
  value: SourceType;
  onChange: (value: SourceType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Source"
      className="glass-inset inline-flex w-full gap-1 rounded-full p-1 sm:w-auto"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:flex-none",
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
