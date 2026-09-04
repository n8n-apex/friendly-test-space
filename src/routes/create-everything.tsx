import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AppShell, Panel } from "@/components/ops/AppShell";
import {
  CategoriesField,
  SourceTabs,
  isValidGoogleDocUrl,
  parseCategories,
} from "@/components/ops/CategoriesField";
import { FileDropzone } from "@/components/FileDropzone";
import { StepList } from "@/components/ops/StepList";
import { ErrorPanel, toErrorState, type WorkflowErrorState } from "@/components/ops/ErrorPanel";
import { ResultPanel } from "@/components/ops/ResultRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TypeToConfirm, isConfirmed } from "@/components/ops/TypeToConfirm";
import { n8nClient } from "@/api/n8nClient";
import { useSteps } from "@/hooks/useSteps";
import {
  COMBINED_STEPS,
  WIPE_STEP,
  type SourceType,
  type WorkflowResult,
} from "@/types/workflow";

export const Route = createFileRoute("/create-everything")({
  head: () => ({
    meta: [
      { title: "Create Everything · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Upload the document to Learning Suite and configure the AI/Form Assistant in one operation, with an optional wipe before upload.",
      },
      { property: "og:title", content: "Create Everything · Learning Suite Operations" },
      {
        property: "og:description",
        content:
          "Run the combined Learning Suite upload and assistant workflow, optionally clearing categories first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateEverything,
});

type Phase = "form" | "running" | "success" | "error";

function CreateEverything() {
  const [agentName, setAgentName] = useState("");
  const [categories, setCategories] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [docLink, setDocLink] = useState("");
  const [wipe, setWipe] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [wipeCompleted, setWipeCompleted] = useState(false);
  const [wipeFailed, setWipeFailed] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [wipeResult, setWipeResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(COMBINED_STEPS);

  const parsed = parseCategories(categories);
  const sourceReady = sourceType === "file" ? file !== null : isValidGoogleDocUrl(docLink);
  const canSubmit =
    agentName.trim().length > 0 && sourceReady && (wipe || parsed.length > 0);

  const activeSteps = wipe ? [WIPE_STEP, ...COMBINED_STEPS] : COMBINED_STEPS;

  const start = () => {
    // Empty categories + wipe = destructive "delete all" — require confirmation.
    if (wipe) {
      setConfirmOpen(true);
      return;
    }
    void run();
  };

  const run = async () => {
    setConfirmOpen(false);
    setConfirmText("");
    setPhase("running");
    setWipeFailed(false);
    setWipeCompleted(false);
    setWipeResult(null);
    steps.start(activeSteps, activeSteps.length - 1);

    const payload = {
      agentName: agentName.trim(),
      categories: categories.trim(),
      sourceType,
      ...(sourceType === "google_doc"
        ? { googleDocLink: docLink.trim() }
        : { file: file ?? undefined }),
    };

    if (wipe) {
      // STEP 1 — wipe must fully succeed before the upload starts.
      steps.activate(0);
      steps.setRunning(false);
      try {
        const cleaned = await n8nClient.propertyCleaner(payload.categories);
        setWipeResult(cleaned);
        setWipeCompleted(true);
      } catch (workflowError) {
        steps.fail();
        setWipeFailed(true);
        setError(toErrorState(workflowError, "The wipe step failed."));
        setPhase("error");
        return; // never continue to the upload
      }
      steps.activate(1);
      steps.setRunning(true);
    }

    try {
      const response = await n8nClient.createEverything(payload);
      steps.complete();
      setResult(response);
      setPhase("success");
    } catch (workflowError) {
      steps.fail();
      setError(toErrorState(workflowError, "Unable to complete the combined operation."));
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("form");
    setResult(null);
    setError(null);
    setWipeFailed(false);
    setWipeCompleted(false);
    steps.reset(activeSteps);
  };

  return (
    <AppShell
      title="Create Everything"
      description="Upload the document to Learning Suite and configure the AI/Form Assistant in one operation."
    >
      <Panel title="Combined upload + assistant">
        {phase === "form" && (
          <>
            <div>
              <Label htmlFor="combined-agent">AI Agent Name</Label>
              <Input
                id="combined-agent"
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Marketing Thesis Assistant"
                className="mt-1.5"
              />
            </div>

            <CategoriesField
              value={categories}
              onChange={setCategories}
              hint="Select one or more categories. The same selection is used for the wipe step when enabled."
            />

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
                <Label htmlFor="combined-doc-link">Google Doc Link</Label>
                <Input
                  id="combined-doc-link"
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

            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="wipe-toggle" className="text-sm">
                  Wipe categories before upload
                </Label>
                <Switch id="wipe-toggle" checked={wipe} onCheckedChange={setWipe} />
              </div>
              {wipe && (
                <p className="mt-2 flex gap-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    This will clear the selected categories before the document is uploaded. If
                    Categories is empty, ALL categories will be cleared.
                  </span>
                </p>
              )}
            </div>

            <Button disabled={!canSubmit} onClick={start}>
              Create Everything
            </Button>
          </>
        )}

        {phase === "running" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Creating Everything…</p>
            <StepList steps={steps.steps} />
          </div>
        )}

        {phase === "success" && result && (
          <ResultPanel
            title="Operation completed"
            rows={[
              { label: "AI Agent", value: result.agentName },
              { label: "Document", value: result.documentName ?? file?.name },
              { label: "Categories processed", value: result.categoriesProcessed },
              { label: "Properties created", value: result.propertiesCreated },
              { label: "Properties updated", value: result.propertiesUpdated },
              { label: "Form Assistant properties", value: result.formAssistantFields },
              { label: "Warnings", value: result.warnings },
              ...(wipeCompleted
                ? [
                    { label: "Wipe", value: "Completed" },
                    { label: "Categories cleared", value: wipeResult?.categoriesCleared },
                  ]
                : []),
            ]}
            onReset={reset}
          />
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <StepList steps={steps.steps} />
            <ErrorPanel
              title={wipeFailed ? "Wipe failed" : "Unable to complete the operation."}
              message={
                wipeFailed
                  ? `The document upload was NOT started. ${error?.message ?? ""}`
                  : error?.message
              }
              details={error?.details}
              onRetry={reset}
            />
          </div>
        )}
      </Panel>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {parsed.length === 0 ? "⚠ WIPE EVERYTHING" : "Wipe categories & continue?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {parsed.length === 0 ? (
                  <>
                    <p>Categories is empty.</p>
                    <p>
                      The wipe step will remove ALL Learning Suite categories and their properties
                      before the document is uploaded.
                    </p>
                    <p className="font-semibold text-destructive">
                      This cannot be treated as a normal empty selection.
                    </p>
                  </>
                ) : (
                  <>
                    <p>These categories will be cleared before the upload:</p>
                    <ul className="font-mono text-xs">
                      {parsed.map((category) => (
                        <li key={category}>{category}</li>
                      ))}
                    </ul>
                    <p>The upload only starts after the wipe succeeds.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <TypeToConfirm value={confirmText} onChange={setConfirmText} id="confirm-wipe" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void run()}
              disabled={!isConfirmed(confirmText)}
              className="disabled:pointer-events-none disabled:opacity-40 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {parsed.length === 0 ? "Wipe Everything & Continue" : "Wipe & Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
