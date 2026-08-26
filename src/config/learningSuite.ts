/**
 * TEMPORARY development configuration.
 *
 * These values exist in ONE place only so they can be replaced later by
 * secure backend configuration. The frontend never renders, logs or sends
 * the API key — n8n remains responsible for using the credential.
 */
export const learningSuiteConfig = {
  graphqlUrl: "https://api.learningsuite.io/clki3mtu62ua7er013378h1o8/graphql",
  apiKey:
    "Y2xraTNtdHU2MnVhN2VyMDEzMzc4aDFvODoyMThjMGM4MzRkOGFlODJjODYyOTVlYjhhOGZkNTNiNzVjZmNhNzFkMDJkNTkwYmM3NmIyNDc1NWQ2MzZlNjYz",
} as const;

export const n8nConfig = {
  /** Set to the real n8n webhook URL to leave mock mode. */
  createFormAssistantWebhook: "",
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
