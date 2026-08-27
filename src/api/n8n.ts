import { n8nConfig } from "@/config/learningSuite";
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

  // The n8n Form trigger expects positional field names (field-0 … field-5),
  // in the order the fields are defined in the form.
  const form = new FormData();
  form.append("field-0", payload.googleDocLink ?? "");
  form.append("field-1", payload.categories);
  form.append("field-2", payload.agentName);
  if (payload.file) {
    form.append("field-3", payload.file, payload.file.name);
  } else {
    form.append("field-3", "");
  }
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
