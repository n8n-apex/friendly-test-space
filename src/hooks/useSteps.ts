import { useCallback, useEffect, useRef, useState } from "react";
import type { Step } from "@/types/workflow";

/**
 * Drives a visual step list while an n8n workflow runs.
 * n8n form triggers return a single response, so intermediate steps are
 * paced optimistically and only the final result uses real values.
 */
export function useSteps(labels: string[]) {
  const [steps, setSteps] = useState<Step[]>(() =>
    labels.map((label, index) => ({ id: `${index}-${label}`, label, state: "pending" })),
  );
  const [running, setRunning] = useState(false);
  const holdRef = useRef<number>(labels.length - 1);

  const reset = useCallback(
    (nextLabels: string[] = labels) => {
      setRunning(false);
      holdRef.current = nextLabels.length - 1;
      setSteps(
        nextLabels.map((label, index) => ({
          id: `${index}-${label}`,
          label,
          state: "pending",
        })),
      );
    },
    [labels],
  );

  const start = useCallback((nextLabels: string[] = labels, holdAt?: number) => {
    holdRef.current = holdAt ?? nextLabels.length - 1;
    setSteps(
      nextLabels.map((label, index) => ({
        id: `${index}-${label}`,
        label,
        state: index === 0 ? "active" : "pending",
      })),
    );
    setRunning(true);
  }, [labels]);

  /** Mark every step up to (excluding) index as done and activate index. */
  const activate = useCallback((index: number) => {
    setSteps((current) =>
      current.map((step, i) => ({
        ...step,
        state: i < index ? "done" : i === index ? "active" : "pending",
      })),
    );
  }, []);

  const complete = useCallback(() => {
    setRunning(false);
    setSteps((current) => current.map((step) => ({ ...step, state: "done" })));
  }, []);

  const fail = useCallback(() => {
    setRunning(false);
    setSteps((current) => {
      const index = current.findIndex((step) => step.state === "active");
      const target = index === -1 ? current.length - 1 : index;
      return current.map((step, i) => ({
        ...step,
        state: i < target ? "done" : i === target ? "failed" : "pending",
      }));
    });
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSteps((current) => {
        const index = current.findIndex((step) => step.state === "active");
        if (index === -1 || index >= holdRef.current) return current;
        const next = [...current];
        next[index] = { ...next[index]!, state: "done" };
        next[index + 1] = { ...next[index + 1]!, state: "active" };
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [running]);

  return { steps, running, start, reset, complete, fail, activate, setRunning };
}
