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
    // Trim values because Railway variables copied from another dashboard can
    // contain an invisible trailing newline. Never log either secret value.
    const url = process.env["N8N_CATEGORIES_WEBHOOK_URL"]?.trim();
    const key = process.env["N8N_CATEGORIES_WEBHOOK_KEY"]?.trim();
    if (!url || !key) {
      console.error("Category source is not configured", {
        hasWebhookUrl: Boolean(url),
        hasWebhookKey: Boolean(key),
      });
      throw new Error("Category source is not configured.");
    }

    // The webhook usually answers in a few seconds; 60s is only an upper bound
    // (the request resolves as soon as n8n replies) and it is retried once.
    const request = async () =>
      fetch(url, {
        method: "GET",
        headers: { "X-Custom-Key": key, Accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });

    let response: Response;
    try {
      response = await request();
    } catch (firstError) {
      console.warn("Category webhook request failed; retrying once", {
        reason: firstError instanceof Error ? firstError.name : "UnknownError",
      });
      try {
        response = await request();
      } catch (secondError) {
        console.error("Category webhook request failed after retry", secondError);
        throw new Error("The category list could not be loaded.");
      }
    }

    if (!response.ok) {
      // Never surface the upstream body/URL to the client.
      console.error("Category webhook returned an error", { status: response.status });
      throw new Error("The category list could not be loaded.");
    }

    // Accepted shapes: { categories: [...] }, [ { categories: [...] } ] and [ ... ].
    const payload = (await response.json()) as unknown;
    const asCategories = (input: unknown): unknown[] | null => {
      if (Array.isArray(input)) return input;
      if (input && typeof input === "object") {
        const list = (input as { categories?: unknown }).categories;
        if (Array.isArray(list)) return list;
      }
      return null;
    };
    const raw =
      asCategories(Array.isArray(payload) ? asCategories(payload[0]) ?? payload : payload) ?? [];

    const categories = raw
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

    if (categories.length === 0) {
      console.error("Category webhook returned no valid categories");
      throw new Error("The category list could not be loaded.");
    }

    return categories;
  },
);
