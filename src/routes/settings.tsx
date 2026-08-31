import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AppShell, Panel } from "@/components/ops/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_N8N_ENDPOINTS,
  WORKFLOW_LABELS,
  getEndpoints,
  resetEndpoints,
  saveEndpoints,
  type WorkflowKey,
} from "@/config/n8n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Administrator endpoint configuration for the n8n workflows powering the Learning Suite operations console.",
      },
      { property: "og:title", content: "Settings · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Review and override the n8n workflow endpoints used by the console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

const keys = Object.keys(DEFAULT_N8N_ENDPOINTS) as WorkflowKey[];

function mask(url: string) {
  if (url.length < 16) return "••••";
  return `${url.slice(0, url.lastIndexOf("/") + 1)}${"•".repeat(12)}`;
}

function Settings() {
  const [unlocked, setUnlocked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [values, setValues] = useState<Record<WorkflowKey, string>>(() => getEndpoints());
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveEndpoints(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const restore = () => {
    resetEndpoints();
    setValues({ ...DEFAULT_N8N_ENDPOINTS });
  };

  return (
    <AppShell
      title="Settings"
      description="Workflow endpoint configuration. No Learning Suite, Google or AI credentials are stored in this application — they remain inside n8n."
    >
      <Panel
        title="n8n workflow endpoints"
        description="Editing is restricted to administrators/developers. Endpoints ship preconfigured; overrides are stored locally on this device."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={unlocked ? "outline" : "default"} onClick={() => setUnlocked((v) => !v)}>
            <Lock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {unlocked ? "Lock editing" : "Unlock editing"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReveal((v) => !v)}>
            {reveal ? (
              <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            ) : (
              <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            {reveal ? "Mask endpoints" : "Reveal endpoints"}
          </Button>
        </div>

        <div className="space-y-4">
          {keys.map((key) => (
            <div key={key}>
              <Label htmlFor={`endpoint-${key}`}>{WORKFLOW_LABELS[key]}</Label>
              <Input
                id={`endpoint-${key}`}
                value={reveal || unlocked ? values[key] : mask(values[key])}
                readOnly={!unlocked}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [key]: event.target.value }))
                }
                className="mt-1.5 font-mono text-xs"
              />
            </div>
          ))}
        </div>

        {unlocked && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={save}>
              Save endpoints
            </Button>
            <Button size="sm" variant="outline" onClick={restore}>
              Restore defaults
            </Button>
            {saved && <span className="text-xs text-muted-foreground">Saved.</span>}
          </div>
        )}
      </Panel>

      <Panel title="Security">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>No Learning Suite bearer tokens or API keys are sent from this GUI.</li>
          <li>Gmail, Google OAuth, Mistral and OpenRouter credentials stay inside n8n.</li>
          <li>Only business inputs (categories, agent name, document, email) are transmitted.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
