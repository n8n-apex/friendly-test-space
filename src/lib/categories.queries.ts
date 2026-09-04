import { queryOptions } from "@tanstack/react-query";
import { listCategories, type LearningSuiteCategory } from "@/lib/categories.functions";

export const CATEGORIES_QUERY_KEY = ["learning-suite-categories"] as const;

/**
 * Shared query for the Learning Suite category list.
 *
 * Every page/field uses this exact key and config, so the categories are
 * fetched ONCE per session and served from the React Query cache everywhere
 * else (no refetch on mount, focus or reconnect).
 */
export const categoriesQueryOptions = (
  fetchCategories: () => Promise<LearningSuiteCategory[]> = () => listCategories(),
) =>
  queryOptions({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => fetchCategories(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // The n8n webhook can take a few seconds (cold start) — retry instead of failing.
    retry: 3,
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 8000),
  });
