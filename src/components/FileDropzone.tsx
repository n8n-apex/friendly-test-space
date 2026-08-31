import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_DOCUMENT_TYPES } from "@/config/n8n";

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
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-mono text-xs">{file.name}</span>
        </span>
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => onChange(null)}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
          "w-full rounded-md border border-dashed border-border px-6 py-8 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          hover && "border-foreground/40 bg-muted/60",
        )}
      >
        <p className="text-sm">Drag &amp; drop a document here</p>
        <p className="mt-1 text-xs text-muted-foreground">or click to browse files</p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          PDF · DOC · DOCX · TXT · MD · RTF · ODT
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES}
        className="sr-only"
        aria-label="Upload document"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </>
  );
}
