export const n8nConfig = {
  /** n8n form URL that receives the Create Form Assistant submission. */
  createFormAssistantWebhook:
    "https://apexcnsltng.app.n8n.cloud/form/ecdf6bad-28b0-43df-8920-9f95507b1358",
  /** Mock mode is active while no webhook URL is configured. */
  get mockMode() {
    return this.createFormAssistantWebhook.length === 0;
  },
} as const;

/**
 * Placeholder category source. Replace with
 * LearningSuite -> n8n -> categories without touching the UI.
 */
export const defaultCategories = ["Rohdaten", "Copy-Doppel", "Verdichtung", "Outputs"] as const;
