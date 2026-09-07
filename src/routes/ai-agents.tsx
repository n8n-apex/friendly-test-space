import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell, Instructions, Panel } from "@/components/ops/AppShell";
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
      { title: "AI Agents · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Create the AI Agent, match document prompts to Learning Suite properties and configure the Form Assistant.",
      },
      { property: "og:title", content: "AI Agents · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Run the Learning Suite assistant creation workflow from a document.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiAgents,
});

function AiAgents() {
  const [sourceType, setSourceType] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [docLink, setDocLink] = useState("");
  const [categories, setCategories] = useState("");
  const [agentName, setAgentName] = useState("");
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
      title="Create Assistant"
      description="Builds the AI Agent from a document and configures the Form Assistant."
    >
      <Instructions
        steps={[
          "Add the document first.",
          "Check the categories it should cover.",
          "Name the AI Agent.",
          "Start and follow the steps.",
        ]}
      />

      <Panel title="Assistant">
        {phase === "form" && (
          <>
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
                <Label htmlFor="assistant-doc-link">Google Doc link</Label>
                <Input
                  id="assistant-doc-link"
                  type="url"
                  inputMode="url"
                  value={docLink}
                  onChange={(event) => setDocLink(event.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="neo-inset mt-1.5 rounded-xl border-0 font-mono text-sm"
                />
                {docLink.length > 0 && !isValidGoogleDocUrl(docLink) && (
                  <p className="mt-1.5 text-xs text-destructive">
                    The link must start with https://docs.google.com/.
                  </p>
                )}
              </div>
            )}

            <CategoriesField
              value={categories}
              onChange={setCategories}
              disabled={!sourceReady}
              disabledHint="Add the document first — then pick its categories."
            />

            <div>
              <Label htmlFor="agent-name">AI Agent name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Marketing Thesis Assistant"
                className="neo-inset mt-1.5 rounded-xl border-0"
              />
            </div>

            <Button disabled={!canSubmit} onClick={submit} className="neo-raised rounded-xl">
              Create Assistant
            </Button>
          </>
        )}

        {phase === "running" && <StepList steps={steps.steps} />}

        {phase === "success" && result && (
          <ResultPanel
            title="Assistant created"
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
        className="glass-panel flex items-center justify-between gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
      >
        <span>
          <span className="block text-sm font-semibold">Create Everything</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Upload the document and configure the assistant in one run.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
    </AppShell>
  );
}
