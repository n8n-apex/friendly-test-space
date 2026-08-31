import { getEndpoint, type WorkflowKey } from "@/config/n8n";
import type {
  CreateFormAssistantPayload,
  UploadDocumentPayload,
  WorkflowResult,
} from "@/types/workflow";

export class WorkflowError extends Error {
  details: string;
  constructor(message: string, details = "") {
    super(message);
    this.name = "WorkflowError";
    this.details = details;
  }
}

const REQUEST_TIMEOUT_MS = 180_000;

function toLocalIsoString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${date.getMilliseconds().toString().padStart(3, "0")}` +
    `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  );
}

type FieldValue = string | File | null | undefined;

/**
 * Posts positional form fields to an n8n Form Trigger as
 * multipart/form-data (the format the Form node requires).
 * Works unchanged if the endpoint is later swapped for a JSON webhook.
 */
async function submitWorkflow(
  key: WorkflowKey,
  fields: FieldValue[],
): Promise<WorkflowResult> {
  const url = getEndpoint(key);
  if (!url) throw new WorkflowError("No endpoint configured for this workflow.", key);

  const form = new FormData();
  fields.forEach((value, index) => {
    const name = `field-${index}`;
    if (value instanceof File) form.append(name, value, value.name);
    else form.append(name, value ?? "");
  });
  form.append("submittedAt", toLocalIsoString(new Date()));
  form.append("formMode", "production");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form, signal: controller.signal });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new WorkflowError(
        "The workflow did not respond in time.",
        `Timeout after ${REQUEST_TIMEOUT_MS / 1000}s · ${url}`,
      );
    }
    throw new WorkflowError(
      "The workflow could not be reached.",
      error instanceof Error ? `${error.message} · ${url}` : String(error),
    );
  }
  clearTimeout(timer);

  const text = await response.text();

  if (!response.ok) {
    throw new WorkflowError(
      `The workflow returned an error (HTTP ${response.status}).`,
      text.slice(0, 4000),
    );
  }

  // Form triggers may reply with HTML instead of JSON.
  let data: Partial<WorkflowResult> = {};
  try {
    const parsed = JSON.parse(text) as unknown;
    const object = Array.isArray(parsed) ? parsed[0] : parsed;
    if (object && typeof object === "object") data = object as Partial<WorkflowResult>;
  } catch {
    data = {};
  }

  if (data.success === false) {
    throw new WorkflowError("The workflow reported a failure.", text.slice(0, 4000));
  }

  return { ...data, success: true, raw: text.slice(0, 4000) };
}

export const n8nClient = {
  /** Categories empty => clears ALL categories (destructive). */
  propertyCleaner(categories: string) {
    return submitWorkflow("propertyCleaner", [categories]);
  },

  propertySummaryEmailer(email: string) {
    return submitWorkflow("propertySummaryEmailer", [email]).then((result) => ({
      ...result,
      recipient: result.recipient ?? email,
    }));
  },

uploadDocument(payload: UploadDocumentPayload) {
    return submitWorkflow("uploadDocument", [
      payload.sourceType === "google_doc" ? (payload.googleDocLink ?? "") : "",
      payload.sourceType === "file" ? (payload.file ?? "") : "",
    ]);
  },

  createAssistant(payload: CreateFormAssistantPayload) {
    return submitWorkflow("assistantCreation", [
      payload.agentName,
      payload.categories,
      payload.sourceType === "file" ? (payload.file ?? "") : "",
      payload.sourceType === "google_doc" ? (payload.googleDocLink ?? "") : "",
    ]).then((result) => ({ ...result, agentName: result.agentName ?? payload.agentName }));
  },

  /** Existing combined upload + assistant workflow (unchanged field order). */
  createEverything(payload: CreateFormAssistantPayload) {
    return submitWorkflow("combinedCreation", [
      payload.sourceType === "google_doc" ? (payload.googleDocLink ?? "") : "",
      "",
      "",
      payload.categories,
      payload.agentName,
      payload.sourceType === "file" ? (payload.file ?? "") : "",
    ]).then((result) => ({
      ...result,
      agentName: result.agentName ?? payload.agentName,
      documentName: result.documentName ?? payload.file?.name,
    }));
  },
};
