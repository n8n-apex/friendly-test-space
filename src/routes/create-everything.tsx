import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { AppShell, Instructions } from "@/components/ops/AppShell";
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
import { n8nClient, fetchDocumentCategories } from "@/api/n8nClient";
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
  const [sourceType, setSourceType] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [docLink, setDocLink] = useState("");
  const [categories, setCategories] = useState("");
  const [agentName, setAgentName] = useState("");
  const [wipe, setWipe] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(COMBINED_STEPS);

  const parsed = parseCategories(categories);
  const sourceReady = sourceType === "file" ? file !== null : isValidGoogleDocUrl(docLink);
  const canSubmit = sourceReady && agentName.trim().length > 0 && (wipe || parsed.length > 0);

  // Wait until typing settles before starting a read that can run for minutes.
  const [settledDocLink, setSettledDocLink] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledDocLink(docLink.trim()), 800);
    return () => window.clearTimeout(timer);
  }, [docLink]);

  // The document decides which categories exist; read it as soon as it is ready.
  const documentKey =
    sourceType === "file"
      ? file
        ? `file:${file.name}:${file.size}:${file.lastModified}`
        : ""
      : isValidGoogleDocUrl(settledDocLink)
        ? settledDocLink
        : "";
  const documentCategoriesQuery = useQuery({
    queryKey: ["document-categories", documentKey],
    enabled: sourceReady && documentKey.length > 0,
    queryFn: () =>
      fetchDocumentCategories({
        sourceType,
        ...(sourceType === "google_doc"
          ? { googleDocLink: settledDocLink }
          : { file: file ?? undefined }),
      }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    // The read can take up to 2 minutes; never queue a second full wait.
    retry: false,
  });

  const activeSteps = wipe ? [WIPE_STEP, ...COMBINED_STEPS] : COMBINED_STEPS;

  const start = () => {
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
      // STEP 1 — the wipe must fully succeed before the upload starts.
      steps.activate(0);
      steps.setRunning(false);
      try {
        await n8nClient.propertyCleaner(payload.categories);
      } catch (workflowError) {
        steps.fail();
        setError(toErrorState(workflowError, "The wipe step failed."));
        setPhase("error");
        return;
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
    steps.reset(activeSteps);
  };

  return (
    <AppShell
      title="Create Everything"
      description="One run: send the document, update the categories and configure the AI/Form Assistant."
    >
      <Instructions
        steps={[
          "Add the document first — it decides the categories.",
          "Check the categories: existing ones come from Learning Suite, new ones from your document.",
          "Name the AI Agent.",
          "Turn on the wipe only if the categories should be emptied first.",
        ]}
      />

      <section className="neo-panel animate-fade-up rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Document, categories & assistant</h2>
        <div className="mt-5 space-y-5">
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
                  <Label htmlFor="combined-doc-link">Google Doc link</Label>
                  <Input
                    id="combined-doc-link"
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
                documentCategories={documentCategoriesQuery.data ?? []}
                documentLoading={documentCategoriesQuery.isFetching}
                documentEmpty={
                  documentCategoriesQuery.isFetched && (documentCategoriesQuery.data ?? []).length === 0
                }

                hint="Existing categories come from Learning Suite. Add any extra one you found in the document."
              />

              <div>
                <Label htmlFor="combined-agent">AI Agent name</Label>
                <Input
                  id="combined-agent"
                  value={agentName}
                  onChange={(event) => setAgentName(event.target.value)}
                  placeholder="Marketing Thesis Assistant"
                  className="neo-inset mt-1.5 rounded-xl border-0"
                />
              </div>

              <div className="glass-inset rounded-xl p-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="wipe-toggle" className="text-sm">
                    Wipe categories before the upload
                  </Label>
                  <Switch id="wipe-toggle" checked={wipe} onCheckedChange={setWipe} />
                </div>
                {wipe && (
                  <p className="mt-2 flex gap-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      The selected categories are cleared first. With none selected, ALL categories
                      are cleared.
                    </span>
                  </p>
                )}
              </div>

              <Button disabled={!canSubmit} onClick={start} className="neo-raised rounded-xl">
                Create Everything
              </Button>
            </>
          )}

          {phase === "running" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Running. You can keep this tab open.</p>
              <StepList steps={steps.steps} />
            </div>
          )}

          {phase === "success" && result && (
            <ResultPanel
              title="Everything created"
              rows={[
                { label: "Document", value: result.documentName ?? file?.name },
                { label: "Agent", value: result.agentName ?? agentName },
                { label: "Categories", value: result.categoriesProcessed ?? parsed.length },
                { label: "Properties created", value: result.propertiesCreated },
                { label: "Properties updated", value: result.propertiesUpdated },
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
                title="The combined operation did not finish."
                message={error?.message}
                details={error?.details}
                onRetry={reset}
              />
            </div>
          )}
        </div>
      </section>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent className="glass-panel rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {parsed.length === 0 ? "Wipe everything?" : "Wipe categories & continue?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {parsed.length === 0 ? (
                  <>
                    <p>No categories are selected.</p>
                    <p className="font-semibold text-destructive">
                      ALL Learning Suite categories and their properties will be removed before the
                      upload.
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
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void run()}
              disabled={!isConfirmed(confirmText)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-40"
            >
              Wipe & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
