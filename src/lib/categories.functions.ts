import { createServerFn } from "@tanstack/react-start";

export type LearningSuiteCategory = {
  id: string;
  name: string;
  sortIndex?: number | undefined;
};

/**
 * Server-side proxy for the n8n categories webhook.
 *
 * The webhook URL and its X-Custom-Key live only in server-side secrets
 * (N8N_CATEGORIES_WEBHOOK_URL / N8N_CATEGORIES_WEBHOOK_KEY) and are read
 * inside the handler, so neither ever reaches the browser bundle, the
 * network tab, or any client-visible error message.
 */
export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<LearningSuiteCategory[]> => {
    const url = process.env["N8N_CATEGORIES_WEBHOOK_URL"];
    const key = process.env["N8N_CATEGORIES_WEBHOOK_KEY"];
    if (!url || !key) throw new Error("Category source is not configured.");

    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Custom-Key": key, Accept: "application/json" },
    });

    if (!response.ok) {
      // Never surface the upstream body/URL to the client.
      throw new Error("The category list could not be loaded.");
    }

    const payload = (await response.json()) as unknown;
    const root = Array.isArray(payload) ? payload[0] : payload;
    const raw =
      root && typeof root === "object" && Array.isArray((root as { categories?: unknown }).categories)
        ? ((root as { categories: unknown[] }).categories as unknown[])
        : [];

    return raw
      .map((item) => {
        if (typeof item === "string") return { id: item, name: item };
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const name = typeof record["name"] === "string" ? record["name"] : "";
          if (!name) return null;
          return {
            id: typeof record["id"] === "string" ? record["id"] : name,
            name,
            sortIndex: typeof record["sortIndex"] === "number" ? record["sortIndex"] : undefined,
          };
        }
        return null;
      })
      .filter((item): item is LearningSuiteCategory => item !== null)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
  },
);
