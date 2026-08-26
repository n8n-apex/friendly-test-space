import { n8nConfig } from "@/config/learningSuite";
import type { CreateFormAssistantPayload, WorkflowResult } from "@/types/workflow";
import { mockCreateFormAssistant } from "./mock";

/**
 * Sends the operation payload to n8n. n8n normalizes it into the legacy
 * form values and runs the existing workflow. No credentials are sent here.
 */
export async function createFormAssistant(
  payload: CreateFormAssistantPayload,
): Promise<WorkflowResult> {
  if (n8nConfig.mockMode) return mockCreateFormAssistant(payload);

  const body = new FormData();
  body.append("agentName", payload.agentName);
  body.append("categories", JSON.stringify(payload.categories));
  body.append("sourceType", payload.sourceType);
  if (payload.sourceType === "google_doc" && payload.googleDocLink) {
    body.append("googleDocLink", payload.googleDocLink);
  }
  if (payload.sourceType === "file" && payload.file) {
    body.append("file", payload.file, payload.file.name);
  }

  const response = await fetch(n8nConfig.createFormAssistantWebhook, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Workflow request failed (${response.status})`);
  }

  const data = (await response.json()) as Partial<WorkflowResult>;
  return {
    success: data.success ?? true,
    agentName: data.agentName ?? payload.agentName,
    ...data,
  };
}
