import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { About, AppShell, Instructions, Panel } from "@/components/ops/AppShell";
import { CategoriesField, parseCategories } from "@/components/ops/CategoriesField";
import { StepList } from "@/components/ops/StepList";
import { ErrorPanel, toErrorState, type WorkflowErrorState } from "@/components/ops/ErrorPanel";
import { ResultPanel } from "@/components/ops/ResultRows";
import { Button } from "@/components/ui/button";
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
import { CLEANER_STEPS, type WorkflowResult } from "@/types/workflow";

export const Route = createFileRoute("/property-tools")({
  head: () => ({
    meta: [
      { title: "Property Tools · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Clear Learning Suite custom-field categories and their properties with an explicit destructive-action confirmation.",
      },
      { property: "og:title", content: "Property Tools · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Run the Property Cleaner workflow against selected Learning Suite categories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyTools,
});

type Phase = "form" | "running" | "success" | "error";

function PropertyTools() {
  const [categories, setCategories] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(CLEANER_STEPS);

  const parsed = parseCategories(categories);
  const wipeAll = parsed.length === 0;

  const run = async () => {
    setConfirmOpen(false);
    setConfirmText("");
    setPhase("running");
    steps.start(CLEANER_STEPS, CLEANER_STEPS.length - 1);
    try {
      const response = await n8nClient.propertyCleaner(categories.trim());
      steps.complete();
      setResult(response);
      setPhase("success");
    } catch (workflowError) {
      steps.fail();
      setError(toErrorState(workflowError, "Unexpected workflow failure."));
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("form");
    setResult(null);
    setError(null);
    steps.reset(CLEANER_STEPS);
  };

  return (
    <AppShell
      title="Property Cleaner"
      description="Clears Learning Suite categories and the properties inside them."
    >
      <About
        what="Empties Learning Suite categories: the category stays, the fields inside it are removed. Use it before a fresh upload when old fields should not stick around."
        notes={[
          {
            q: "What if I select nothing?",
            a: "Everything is cleared — all categories and all their fields. Only do that on purpose.",
          },
          {
            q: "Can I undo it?",
            a: "No. Deleted fields are gone, which is why you have to type DELETE first.",
          },
          {
            q: "I only see Learning Suite categories",
            a: "Correct — this page works on what already exists, so no document is needed.",
          },
          {
            q: "Does it touch learner data?",
            a: "It removes the fields themselves, so anything stored in them disappears with them.",
          },
        ]}
      />

      <Instructions
        steps={[
          "Pick the categories to clear.",
          "Leaving it empty means all categories.",
          "Type DELETE to confirm.",
          "This cannot be undone.",
        ]}
      />

      <Panel title="Categories to clear" tone="danger">
        {phase === "form" && (
          <>
            <CategoriesField
              value={categories}
              onChange={setCategories}
              hint="Existing categories come from Learning Suite. Leave empty to target ALL of them."
            />

            <div className="danger-panel rounded-xl p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden /> Destructive
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                An empty selection clears <strong>ALL</strong> categories and their properties.
              </p>
            </div>

            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              className="neo-raised rounded-xl"
            >
              Clear Properties
            </Button>
          </>
        )}

        {phase === "running" && <StepList steps={steps.steps} />}

        {phase === "success" && result && (
          <ResultPanel
            title="Properties cleared"
            rows={[
              { label: "Categories requested", value: wipeAll ? "ALL" : parsed.join(", ") },
              { label: "Categories cleared", value: result.categoriesCleared },
              { label: "Properties removed", value: result.propertiesUpdated },
              { label: "Warnings", value: result.warnings },
            ]}
            onReset={reset}
          />
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <StepList steps={steps.steps} />
            <ErrorPanel
              title="Unable to clear the properties."
              message={error?.message}
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
        <AlertDialogContent className="glass-panel rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear properties?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {wipeAll ? (
                  <>
                    <p>You have not selected any categories.</p>
                    <p className="font-semibold text-destructive">
                      This means ALL categories will be cleared.
                    </p>
                  </>
                ) : (
                  <>
                    <p>You are about to clear:</p>
                    <ul className="font-mono text-xs">
                      {parsed.map((category) => (
                        <li key={category}>{category}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p>This changes Learning Suite and cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <TypeToConfirm value={confirmText} onChange={setConfirmText} />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void run()}
              disabled={!isConfirmed(confirmText)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-40"
            >
              Clear Properties
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
