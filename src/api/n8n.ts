import { learningSuiteConfig, n8nConfig } from "@/config/learningSuite";
import type { CreateFormAssistantPayload, WorkflowResult } from "@/types/workflow";
import { mockCreateFormAssistant } from "./mock";

function toLocalIsoString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, "0");

  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Sends the operation payload to the n8n Form trigger as
 * multipart/form-data, which the Form node requires.
 */
export async function createFormAssistant(
  payload: CreateFormAssistantPayload,
): Promise<WorkflowResult> {
  if (n8nConfig.mockMode) return mockCreateFormAssistant(payload);

  const form = new FormData();
  form.append("Google Doc Link", payload.googleDocLink ?? "");
  form.append("Request URL", learningSuiteConfig.graphqlUrl);
  form.append("API Key", learningSuiteConfig.apiKey);
  form.append("Categories", payload.categories);
  form.append("AI Agent Name", payload.agentName);
  if (payload.file) form.append("File", payload.file, payload.file.name);
  form.append("submittedAt", toLocalIsoString(new Date()));
  form.append("formMode", "production");

  const response = await fetch(n8nConfig.createFormAssistantWebhook, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Workflow request failed (${response.status})`);
  }

  // The n8n Form trigger may reply with HTML instead of JSON.
  const text = await response.text();
  let data: Partial<WorkflowResult> = {};
  try {
    data = JSON.parse(text) as Partial<WorkflowResult>;
  } catch {
    data = {};
  }

  return {
    success: data.success ?? true,
    agentName: data.agentName ?? payload.agentName,
    ...data,
  };
}
