import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { GlassCard, FieldLabel } from "@/components/GlassCard";
import { SourceSelector } from "@/components/SourceSelector";
import { CategorySelector } from "@/components/CategorySelector";
import { FileDropzone } from "@/components/FileDropzone";
import { ProgressView } from "@/components/ProgressView";
import { ResultView } from "@/components/ResultView";
import { ErrorView } from "@/components/ErrorView";
import { createFormAssistant } from "@/api/n8n";
import { defaultCategories } from "@/config/learningSuite";
import {
  progressStepLabels,
  type ProgressStep,
  type SourceType,
  type WorkflowResult,
} from "@/types/workflow";

type Phase = "form" | "running" | "success" | "error";

function buildSteps(activeIndex: number): ProgressStep[] {
  return progressStepLabels.map((step, index) => ({
    ...step,
    state: index < activeIndex ? "done" : index === activeIndex ? "active" : "pending",
  }));
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function Home() {
  const [phase, setPhase] = useState<Phase>("form");
  const [agentName, setAgentName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>("google_doc");
  const [googleDocLink, setGoogleDocLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const canSubmit = useMemo(() => {
    const hasSource =
      sourceType === "google_doc" ? isValidUrl(googleDocLink) : file !== null;
    return agentName.trim().length > 0 && categories.length > 0 && hasSource;
  }, [agentName, categories, sourceType, googleDocLink, file]);

  // Simulated progress while waiting for n8n; swap for real backend events later.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      setStepIndex((index) => Math.min(index + 1, progressStepLabels.length - 1));
    }, 900);
    return () => clearInterval(timer);
  }, [phase]);

  const submit = async () => {
    setPhase("running");
    setStepIndex(0);
    try {
      const workflowResult = await createFormAssistant({
        agentName: agentName.trim(),
        categories,
        sourceType,
        ...(sourceType === "google_doc"
          ? { googleDocLink: googleDocLink.trim() }
          : { file: file ?? undefined }),
      });
      setResult(workflowResult);
      setPhase("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("form");
    setResult(null);
    setErrorMessage(undefined);
    setStepIndex(0);
  };

  const nameError = nameTouched && agentName.trim().length === 0;

  return (
    <main className="app-bg min-h-screen w-full px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="animate-fade-up mb-10 text-center">
          <h1 className="text-2xl font-medium tracking-tight sm:text-[28px]">
            LearningSuite Form Builder
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/50">
            Create and configure LearningSuite fields from your onboarding document.
          </p>
        </header>

        <GlassCard>
          {phase === "form" && (
            <div className="space-y-7">
              <h2 className="text-base font-medium tracking-tight">Create from document</h2>

              <div>
                <FieldLabel htmlFor="agent-name">AI Agent Name</FieldLabel>
                <input
                  id="agent-name"
                  value={agentName}
                  onChange={(event) => setAgentName(event.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Thesis Form Assistant"
                  aria-invalid={nameError}
                  aria-describedby={nameError ? "agent-name-error" : undefined}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder:text-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                />
                {nameError && (
                  <p id="agent-name-error" className="mt-2 text-xs text-destructive/80">
                    Please enter a name for the AI Agent.
                  </p>
                )}
              </div>

              <div>
                <FieldLabel>Categories</FieldLabel>
                <CategorySelector
                  options={defaultCategories}
                  selected={categories}
                  onChange={setCategories}
                />
              </div>

              <div>
                <FieldLabel>Source</FieldLabel>
                <SourceSelector value={sourceType} onChange={setSourceType} />
              </div>

              {sourceType === "google_doc" ? (
                <div className="animate-fade-up">
                  <FieldLabel htmlFor="doc-url">Google Doc URL</FieldLabel>
                  <input
                    id="doc-url"
                    type="url"
                    inputMode="url"
                    value={googleDocLink}
                    onChange={(event) => setGoogleDocLink(event.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder:text-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  />
                  {googleDocLink.length > 0 && !isValidUrl(googleDocLink) && (
                    <p className="mt-2 text-xs text-destructive/80">
                      This doesn&apos;t look like a valid link.
                    </p>
                  )}
                </div>
              ) : (
                <div className="animate-fade-up">
                  <FieldLabel>Upload document</FieldLabel>
                  <FileDropzone file={file} onChange={setFile} />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={submit}
                  className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto"
                >
                  Create Form Assistant
                </button>
              </div>
            </div>
          )}

          {phase === "running" && (
            <div className="space-y-7">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </div>
              <ProgressView steps={buildSteps(stepIndex)} />
            </div>
          )}

          {phase === "success" && result && <ResultView result={result} onDone={reset} />}
          {phase === "error" && <ErrorView message={errorMessage} onRetry={reset} />}
        </GlassCard>

        <p className="mt-8 text-center text-[11px] tracking-wide text-foreground/30">
          Powered by n8n
        </p>
      </div>
    </main>
  );
}
