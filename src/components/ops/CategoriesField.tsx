import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function parseCategories(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function CategoriesField({
  value,
  onChange,
  hint = "Enter one or more category names separated by commas.",
  id = "categories",
}: {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  id?: string;
}) {
  const parsed = parseCategories(value);

  return (
    <div>
      <Label htmlFor={id}>Categories</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Anbieter-Profil, Zielgruppen-Profil"
        className="mt-1.5 font-mono text-sm"
      />
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      {parsed.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {parsed.map((category) => (
            <span
              key={category}
              className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px]"
            >
              {category}
            </span>
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
