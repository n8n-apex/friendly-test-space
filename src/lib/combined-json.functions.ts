import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_N8N_ENDPOINTS } from "@/config/n8n";

const inputSchema = z.object({
  "Google Doc Link": z.string().nullable(),
  File: z
    .object({
      name: z.string(),
      mimeType: z.string(),
      size: z.number(),
      data: z.string(),
    })
    .nullable(),
});

/**
 * Server-side proxy for the combined "Create Everything" JSON webhook.
 *
 * The webhook requires the same X-Custom-Key header as the categories
 * webhook, so the call is proxied here: the key lives only in server-side
 * secrets and never reaches the browser bundle or the network tab.
 * URL override: N8N_COMBINED_JSON_WEBHOOK_URL (falls back to the config URL).
 * Key: N8N_CATEGORIES_WEBHOOK_KEY / CATEGORIES_WEBHOOK_KEY.
 */
export const forwardCombinedDocument = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const read = (...names: string[]) => {
      for (const name of names) {
        const value = process.env[name]?.trim();
        if (value) return value;
      }
      return undefined;
    };
    const url = read("N8N_COMBINED_JSON_WEBHOOK_URL") ?? DEFAULT_N8N_ENDPOINTS.combinedCreationJson;
    const key = read("N8N_CATEGORIES_WEBHOOK_KEY", "CATEGORIES_WEBHOOK_KEY");
    if (!url || !key) {
      console.error("Document webhook is not configured. Set the webhook key as an environment variable on the hosting service (Railway).", {
        hasWebhookUrl: Boolean(url),
        hasWebhookKey: Boolean(key),
      });
      throw new Error("The document webhook is not configured.");
    }

    // The workflow may take a while; 180s is only an upper bound and the
    // request is retried once for transient network failures / cold starts.
    const post = async () =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Key": key,
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(180_000),
      });

    let response: Response;
    try {
      response = await post();
    } catch (firstError) {
      console.warn("Document webhook request failed; retrying once", {
        reason: firstError instanceof Error ? firstError.name : "UnknownError",
      });
      try {
        response = await post();
      } catch (secondError) {
        console.error("Document webhook request failed after retry", {
          reason: secondError instanceof Error ? secondError.name : "UnknownError",
        });
        throw new Error("The document webhook could not be reached.");
      }
    }


    if (!response.ok) {
      // Never surface the upstream body/URL to the client.
      console.error("Document webhook returned an error", { status: response.status });
      throw new Error(`The document webhook returned an error (HTTP ${response.status}).`);
    }

    const text = await response.text();
    return { success: true as const, categories: parseCategoryNames(text) };
  });

/** Accepts { categories: [...] }, [ { categories: [...] } ] or a plain array. */
function parseCategoryNames(text: string): string[] {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return [];
  }
  const unwrap = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
      if (value.length > 0 && value.every((item) => typeof item === "string")) return value;
      const nested = value.flatMap((item) => unwrap(item));
      return nested.length > 0 ? nested : value;
    }
    if (value && typeof value === "object" && "categories" in value) {
      return unwrap((value as { categories: unknown }).categories);
    }
    return [];
  };

  const names = unwrap(payload).map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object" && "name" in item) {
      return String((item as { name: unknown }).name ?? "").trim();
    }
    return "";
  });

  return Array.from(new Set(names.filter((name) => name.length > 0)));
}
