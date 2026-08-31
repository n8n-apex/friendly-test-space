import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell, Panel } from "@/components/ops/AppShell";
import {
  CategoriesField,
  SourceTabs,
  isValidGoogleDocUrl,
} from "@/components/ops/CategoriesField";
import { FileDropzone } from "@/components/FileDropzone";
import { StepList } from "@/components/ops/StepList";
import { ErrorPanel, toErrorState, type WorkflowErrorState } from "@/components/ops/ErrorPanel";
import { ResultPanel } from "@/components/ops/ResultRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { n8nClient } from "@/api/n8nClient";
import { useSteps } from "@/hooks/useSteps";
import { ASSISTANT_STEPS, type SourceType, type WorkflowResult } from "@/types/workflow";

export const Route = createFileRoute("/ai-agents")({
  head: () => ({
    meta: [
      { title: "Assistant Creation · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Create an AI Agent and configure its Form Assistant from a document or Google Doc using the existing automation.",
      },
      { property: "og:title", content: "Assistant Creation · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Create and configure a Learning Suite AI/Form Assistant from a document.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiAgents,
});

function AiAgents() {
  const [agentName, setAgentName] = useState("");
  const [categories, setCategories] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [docLink, setDocLink] = useState("");
  const [phase, setPhase] = useState<"form" | "running" | "success" | "error">("form");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(ASSISTANT_STEPS);

  const sourceReady = sourceType === "file" ? file !== null : isValidGoogleDocUrl(docLink);
  const canSubmit =
    agentName.trim().length > 0 && categories.trim().length > 0 && sourceReady;

  const submit = async () => {
    setPhase("running");
    steps.start(ASSISTANT_STEPS, ASSISTANT_STEPS.length - 1);
    try {
      const response = await n8nClient.createAssistant({
        agentName: agentName.trim(),
        categories: categories.trim(),
        sourceType,
        ...(sourceType === "google_doc"
          ? { googleDocLink: docLink.trim() }
          : { file: file ?? undefined }),
      });
      steps.complete();
      setResult(response);
      setPhase("success");
    } catch (workflowError) {
      steps.fail();
      setError(toErrorState(workflowError, "Unable to configure the Form Assistant."));
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("form");
    setResult(null);
    setError(null);
    steps.reset(ASSISTANT_STEPS);
  };

  return (
    <AppShell
      title="Assistant Creation"
      description="Creates the AI Agent, matches document prompts to Learning Suite properties and configures the Form Assistant."
    >
      <Panel title="Create Assistant">
        {phase === "form" && (
          <>
            <div>
              <Label htmlFor="agent-name">AI Agent Name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Marketing Thesis Assistant"
                className="mt-1.5"
              />
            </div>

            <CategoriesField value={categories} onChange={setCategories} />

            <SourceTabs value={sourceType} onChange={setSourceType} />

            {sourceType === "file" ? (
              <div>
                <Label>Document</Label>
                <div className="mt-1.5">
                  <FileDropzone file={file} onChange={setFile} />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="assistant-doc-link">Google Doc Link</Label>
                <Input
                  id="assistant-doc-link"
                  type="url"
                  inputMode="url"
                  value={docLink}
                  onChange={(event) => setDocLink(event.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="mt-1.5 font-mono text-sm"
                />
                {docLink.length > 0 && !isValidGoogleDocUrl(docLink) && (
                  <p className="mt-1.5 text-xs text-destructive">
                    The link must start with https://docs.google.com/.
                  </p>
                )}
              </div>
            )}

            <Button disabled={!canSubmit} onClick={submit}>
              Create Assistant
            </Button>
          </>
        )}

        {phase === "running" && <StepList steps={steps.steps} />}

        {phase === "success" && result && (
          <ResultPanel
            title="Assistant created successfully"
            rows={[
              { label: "Agent", value: result.agentName },
              { label: "Categories", value: result.categoriesProcessed },
              { label: "Matched properties", value: result.matchedProperties },
              { label: "Unmatched properties", value: result.unmatchedProperties },
              { label: "Form Assistant properties", value: result.formAssistantFields },
              { label: "Warnings", value: result.warnings },
            ]}
            onReset={reset}
          />
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <StepList steps={steps.steps} />
            <ErrorPanel
              title="Unable to configure the Form Assistant."
              message={error?.message}
              details={error?.details}
              onRetry={reset}
            />
          </div>
        )}
      </Panel>

      <Link
        to="/create-everything"
        className="flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4 transition-colors hover:border-foreground/30"
      >
        <span>
          <span className="block text-sm font-semibold">Create Everything</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Upload the document and configure the assistant in one operation.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
    </AppShell>
  );
}
