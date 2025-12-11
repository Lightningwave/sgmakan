import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import cafesFallback from "../data/cafes";
import neighborhoodsFallback from "../data/neighborhoods";

const convexEnabled = Boolean(process.env.REACT_APP_CONVEX_URL);

export function useBackendData() {
  // Always call useQuery unconditionally (React hooks rules)
  // Pass "skip" when Convex is disabled to avoid actual queries
  const cafesFromConvex = useQuery(convexEnabled ? api.cafes.list : "skip");
  const neighborhoodsFromConvex = useQuery(convexEnabled ? api.neighborhoods.list : "skip");

  return useMemo(() => {
    // Use Convex data if available, otherwise fallback to local data
    const cafes = convexEnabled && cafesFromConvex ? cafesFromConvex : cafesFallback;
    const neighborhoods = convexEnabled && neighborhoodsFromConvex ? neighborhoodsFromConvex : neighborhoodsFallback;
    const isLoading = convexEnabled && (cafesFromConvex === undefined || neighborhoodsFromConvex === undefined);

    return {
      cafes,
      neighborhoods,
      isLoading,
      convexEnabled,
      source: convexEnabled ? "convex" : "local",
    };
  }, [cafesFromConvex, neighborhoodsFromConvex]);
}

export function useCafeById(id) {
  const { cafes, isLoading, source } = useBackendData();
  const cafe = useMemo(() => cafes.find((c) => c.id === id), [cafes, id]);

  return { cafe, isLoading, source };
}
