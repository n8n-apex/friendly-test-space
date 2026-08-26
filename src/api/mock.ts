import type { CreateFormAssistantPayload, WorkflowResult } from "@/types/workflow";

/** Mock implementation — delete this file (and its import in n8n.ts) once the webhook is live. */
export async function mockCreateFormAssistant(
  payload: CreateFormAssistantPayload,
): Promise<WorkflowResult> {
  await new Promise((resolve) => setTimeout(resolve, 4200));
  const categoryCount = payload.categories
    .split(",")
    .filter((item) => item.trim().length > 0).length;
  return {
    success: true,
    agentName: payload.agentName || "Demo Assistant",
    categoriesCreated: categoryCount || 4,
    fieldsProcessed: 42,
    formAssistantFields: 38,
    details: { created: 24, updated: 14, skipped: 4, unmatched: 0 },
  };
}
