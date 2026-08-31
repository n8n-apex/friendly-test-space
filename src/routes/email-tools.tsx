import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/ops/AppShell";
import { StepList } from "@/components/ops/StepList";
import { ErrorPanel, toErrorState, type WorkflowErrorState } from "@/components/ops/ErrorPanel";
import { ResultPanel } from "@/components/ops/ResultRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { n8nClient } from "@/api/n8nClient";
import { useSteps } from "@/hooks/useSteps";
import { EMAILER_STEPS, type WorkflowResult } from "@/types/workflow";

export const Route = createFileRoute("/email-tools")({
  head: () => ({
    meta: [
      { title: "Email Tools · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Send the Learning Suite property summary email to a validated recipient address via the existing workflow.",
      },
      { property: "og:title", content: "Email Tools · Learning Suite Operations" },
      {
        property: "og:description",
        content: "Generate and send the Learning Suite property summary email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailTools,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function EmailTools() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<"form" | "running" | "success" | "error">("form");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<WorkflowErrorState | null>(null);
  const steps = useSteps(EMAILER_STEPS);

  const valid = EMAIL_PATTERN.test(email.trim());

  const submit = async () => {
    setPhase("running");
    steps.start(EMAILER_STEPS, EMAILER_STEPS.length - 1);
    try {
      const response = await n8nClient.propertySummaryEmailer(email.trim());
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
    steps.reset(EMAILER_STEPS);
  };

  return (
    <AppShell
      title="Property Summary Emailer"
      description="Generates the Learning Suite property summary and emails it to the recipient."
    >
      <Panel title="Send property summary">
        {phase === "form" && (
          <>
            <div>
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="example@email.com"
                aria-invalid={touched && !valid}
                className="mt-1.5"
              />
              {touched && !valid && (
                <p className="mt-1.5 text-xs text-destructive">
                  Enter a valid email address.
                </p>
              )}
            </div>
            <Button disabled={!valid} onClick={submit}>
              Send Property Summary
            </Button>
          </>
        )}

        {phase === "running" && <StepList steps={steps.steps} />}

        {phase === "success" && result && (
          <ResultPanel
            title="Property summary sent"
            rows={[
              { label: "Recipient", value: result.recipient },
              { label: "Categories", value: result.categoriesProcessed },
              { label: "Warnings", value: result.warnings },
            ]}
            onReset={reset}
            resetLabel="Send another"
          />
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <StepList steps={steps.steps} />
            <ErrorPanel
              title="Unable to send the property summary."
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
