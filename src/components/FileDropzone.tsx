import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
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
      <div className="neo-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-mono text-xs">{file.name}</span>
        </span>
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => onChange(null)}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
          "neo-inset w-full rounded-xl px-6 py-8 text-center transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          hover && "ring-2 ring-primary/30",
        )}
      >
        <UploadCloud className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm">Drop your document here</p>
        <p className="mt-1 text-xs text-muted-foreground">or click to choose a file</p>
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
