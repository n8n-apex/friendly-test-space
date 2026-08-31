import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AppShell, Panel } from "@/components/ops/AppShell";
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
      title="Property Tools"
      description="Maintenance operations on Learning Suite custom fields."
    >
      <Panel
        title="Clear Learning Suite Properties"
        description="Clears Learning Suite custom-field categories and the properties inside them."
        tone="danger"
      >
        {phase === "form" && (
          <>
            <CategoriesField
              value={categories}
              onChange={setCategories}
              hint="Enter one or more category names separated by commas. Examples: Anbieter-Profil · Zielgruppen-Profil · Anbieter-Profil, Zielgruppen-Profil"
            />

            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden /> Destructive operation
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Leaving Categories empty will clear <strong>ALL</strong> categories and their
                properties.
              </p>
            </div>

            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Properties?</AlertDialogTitle>
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
                <p>This action modifies Learning Suite and cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <TypeToConfirm value={confirmText} onChange={setConfirmText} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={run}
              disabled={!isConfirmed(confirmText)}
              className="disabled:pointer-events-none disabled:opacity-40 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {wipeAll ? "Clear EVERYTHING" : "Clear Properties"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
