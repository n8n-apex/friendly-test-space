import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  if (file) {
    return (
      <div className="glass-input flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5">
        <span className="flex min-w-0 items-center gap-2.5 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-foreground/50" />
          <span className="truncate">{file.name}</span>
        </span>
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => onChange(null)}
          className="rounded-full p-1 text-foreground/40 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(event) => {
          event.preventDefault();
          setHover(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) onChange(dropped);
        }}
        className={cn(
          "glass-input w-full rounded-2xl border-dashed px-6 py-9 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          hover && "border-foreground/30 bg-foreground/5",
        )}
      >
        <p className="text-sm text-foreground/70">Drop your document here</p>
        <p className="mt-1 text-xs text-foreground/45">or click to browse</p>
        <p className="mt-3 text-[11px] tracking-wide text-foreground/35">
          PDF · DOCX · other supported documents
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label="Upload document"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </>
  );
}
