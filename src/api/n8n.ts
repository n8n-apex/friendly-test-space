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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Sends the operation payload to n8n as a JSON array matching the
 * expected n8n form structure. The LearningSuite API key and GraphQL
 * URL are included so the workflow can authenticate and mutate data.
 */
export async function createFormAssistant(
  payload: CreateFormAssistantPayload,
): Promise<WorkflowResult> {
  if (n8nConfig.mockMode) return mockCreateFormAssistant(payload);

  const fileValue = payload.file ? await fileToBase64(payload.file) : null;

  const body = JSON.stringify([
    {
      "Google Doc Link": payload.googleDocLink ?? null,
      "Request URL": learningSuiteConfig.graphqlUrl,
      "API Key": learningSuiteConfig.apiKey,
      Categories: payload.categories,
      "AI Agent Name": payload.agentName,
      File: fileValue,
      submittedAt: toLocalIsoString(new Date()),
      formMode: "production",
    },
  ]);

  const response = await fetch(n8nConfig.createFormAssistantWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
