/**
 * Single source of truth for all n8n workflow endpoints.
 *
 * These are currently n8n Form Trigger URLs (`/form/...`). They can be
 * swapped for JSON-returning webhook URLs (`/webhook/...`) here without
 * touching any UI code.
 *
 * No credentials of any kind belong in this file or anywhere in the
 * frontend — LearningSuite / Google / AI credentials stay inside n8n.
 */

export type WorkflowKey =
  | "propertyCleaner"
  | "propertySummaryEmailer"
  | "uploadDocument"
  | "assistantCreation"
  | "combinedCreation";

/** Existing combined "upload document + create assistant" workflow. */
export const EXISTING_COMBINED_WORKFLOW_URL =
  "https://apexcnsltng.app.n8n.cloud/form/ecdf6bad-28b0-43df-8920-9f95507b1358";

export const DEFAULT_N8N_ENDPOINTS: Record<WorkflowKey, string> = {
  propertyCleaner: "https://apexcnsltng.app.n8n.cloud/form/3e548c92-4df0-4de4-827d-52a759481784",
  propertySummaryEmailer:
    "https://apexcnsltng.app.n8n.cloud/form/c5d273d3-ace4-4be0-8fca-4c40f8f049cb",
  uploadDocument: "https://apexcnsltng.app.n8n.cloud/form/7066a383-810f-48e7-bffe-04b61e2fca98",
  assistantCreation: "https://apexcnsltng.app.n8n.cloud/form/faf1c589-95bf-4193-abb5-7f044d20af2e",
  combinedCreation: EXISTING_COMBINED_WORKFLOW_URL,
};

export const WORKFLOW_LABELS: Record<WorkflowKey, string> = {
  propertyCleaner: "Property Cleaner",
  propertySummaryEmailer: "Property Summary Emailer",
  uploadDocument: "Upload Document",
  assistantCreation: "Assistant Creation",
  combinedCreation: "Combined Creation",
};

const STORAGE_KEY = "ls-ops.endpoints";

/** Admin overrides (Settings page) are kept locally, never bundled. */
export function getEndpoints(): Record<WorkflowKey, string> {
  if (typeof window === "undefined") return { ...DEFAULT_N8N_ENDPOINTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_N8N_ENDPOINTS };
    const parsed = JSON.parse(raw) as Partial<Record<WorkflowKey, string>>;
    return { ...DEFAULT_N8N_ENDPOINTS, ...parsed };
  } catch {
    return { ...DEFAULT_N8N_ENDPOINTS };
  }
}

export function saveEndpoints(endpoints: Record<WorkflowKey, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
}

export function resetEndpoints() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getEndpoint(key: WorkflowKey): string {
  return getEndpoints()[key];
}

/** Accepted document types for the existing document workflows. */
export const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.txt,.md,.rtf,.odt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
