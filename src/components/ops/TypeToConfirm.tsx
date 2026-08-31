import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CONFIRM_WORD = "DELETE";

export function isConfirmed(value: string) {
  return value.trim().toUpperCase() === CONFIRM_WORD;
}

/** Extra safety layer for destructive operations: type DELETE to enable. */
export function TypeToConfirm({
  value,
  onChange,
  id = "confirm-delete",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <div className="pt-1">
      <Label htmlFor={id} className="text-sm">
        Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={CONFIRM_WORD}
        autoComplete="off"
        className="mt-1.5 font-mono"
      />
    </div>
  );
}
