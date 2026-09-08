import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { About, AppShell, Instructions, Panel } from "@/components/ops/AppShell";
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
      { title: "Document Tools · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Upload a document or Google Doc to Learning Suite and create or update the matching categories and properties.",
      },
      { property: "og:title", content: "Document Tools · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Run the Learning Suite document upload workflow from a file or Google Doc link.",
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

  const canSubmit = sourceType === "file" ? file !== null : isValidGoogleDocUrl(docLink);

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
      title="Upload Document"
      description="The document decides the categories and properties that get created or updated in Learning Suite."
    >
      <About
        what="Sends one document to Learning Suite. The workflow reads it and creates or updates the categories and fields it finds — you do not pick anything here."
        notes={[
          {
            q: "My document has no categories",
            a: "Then nothing new is created. The result will simply show 0 categories, so add headings to the document and run it again.",
          },
          {
            q: "Will it overwrite my fields?",
            a: "Existing fields are updated, not deleted. Use Property Cleaner if you really want to remove things.",
          },
          {
            q: "Which files work?",
            a: "A text-based document (for example .docx or .pdf) or a Google Doc link that is readable.",
          },
          {
            q: "It takes a while",
            a: "Reading and matching can run for a couple of minutes. Keep the page open until the steps finish.",
          },
        ]}
      />

      <Instructions
        steps={[
          "Choose a file or a Google Doc link.",
          "Add the document.",
          "Start the upload.",
          "The result lists what changed.",
        ]}
      />

      <Panel title="Document">
        {phase === "form" && (
          <>
            <SourceTabs value={sourceType} onChange={setSourceType} />

            {sourceType === "file" ? (
              <div>
                <Label>File</Label>
                <div className="mt-1.5">
                  <FileDropzone file={file} onChange={setFile} />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="doc-link">Google Doc link</Label>
                <Input
                  id="doc-link"
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

            <Button disabled={!canSubmit} onClick={submit} className="neo-raised rounded-xl">
              Upload to Learning Suite
            </Button>
          </>
        )}

        {phase === "running" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Running. You can keep this tab open.
            </p>
            <StepList steps={steps.steps} />
          </div>
        )}

        {phase === "success" && result && (
          <ResultPanel
            title="Document processed"
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
