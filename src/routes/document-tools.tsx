import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/ops/AppShell";
import { SourceTabs, isValidGoogleDocUrl } from "@/components/ops/CategoriesField";
import { FileDropzone } from "@/components/FileDropzone";
import { StepList } from "@/components/ops/StepList";
import { ErrorPanel, toErrorState, type WorkflowErrorState } from "@/components/ops/ErrorPanel";
import { ResultPanel } from "@/components/ops/ResultRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { n8nClient } from "@/api/n8nClient";
import { useSteps } from "@/hooks/useSteps";
import { UPLOAD_STEPS, type SourceType, type WorkflowResult } from "@/types/workflow";

export const Route = createFileRoute("/document-tools")({
  head: () => ({
    meta: [
      { title: "Upload Document · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Upload a file or Google Doc so the existing automation creates and updates Learning Suite properties.",
      },
      { property: "og:title", content: "Upload Document · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Send a document or Google Doc link to the Learning Suite property automation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentTools,
});

function DocumentTools() {
const [sourceType, setSourceType] = useState<SourceType>("file");
  const [file, setFile] = useState<File | null>(null);
  const [docLink, setDocLink] = useState("");
  const [phase, setPhase] = useState<"form" | "running" | "success" | "error">("form");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(UPLOAD_STEPS);

  const sourceReady =
    sourceType === "file" ? file !== null : isValidGoogleDocUrl(docLink);
  const canSubmit = sourceReady;

  const submit = async () => {
setPhase("running");
    steps.start(UPLOAD_STEPS, UPLOAD_STEPS.length - 1);
    try {
      const response = await n8nClient.uploadDocument({
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
      setError(toErrorState(workflowError, "Unable to process the document."));
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("form");
    setResult(null);
    setError(null);
    steps.reset(UPLOAD_STEPS);
  };

  return (
    <AppShell
      title="Upload Document to Learning Suite"
      description="Extracts categories and properties from a document and creates or updates the matching Learning Suite fields."
    >
      <Panel title="Document source">
        {phase === "form" && (
          <>
            <SourceTabs value={sourceType} onChange={setSourceType} />

            {sourceType === "file" ? (
              <div>
                <Label>Upload File</Label>
                <div className="mt-1.5">
                  <FileDropzone file={file} onChange={setFile} />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="doc-link">Google Doc Link</Label>
                <Input
                  id="doc-link"
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
              Upload to Learning Suite
            </Button>
          </>
        )}

        {phase === "running" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The workflow is running. You can keep this tab open — the interface stays
              responsive.
            </p>
            <StepList steps={steps.steps} />
          </div>
        )}

        {phase === "success" && result && (
          <ResultPanel
            title="Document processed successfully"
            rows={[
              { label: "Document", value: result.documentName ?? file?.name },
              { label: "Categories", value: result.categoriesProcessed },
              { label: "Properties created", value: result.propertiesCreated },
              { label: "Properties updated", value: result.propertiesUpdated },
              { label: "Warnings", value: result.warnings },
            ]}
            onReset={reset}
          />
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <StepList steps={steps.steps} />
            <ErrorPanel
              title="Unable to process the document."
              message={error?.message}
              details={error?.details}
              onRetry={reset}
            />
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
