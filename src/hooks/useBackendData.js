import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function useBackendData() {
  const cafesFromConvex = useQuery(api.cafes.list);
  const neighborhoodsFromConvex = useQuery(api.neighborhoods.list);

  return useMemo(() => {
    const cafes = cafesFromConvex ?? [];
    const neighborhoods = neighborhoodsFromConvex ?? [];
    const isLoading = cafesFromConvex === undefined || neighborhoodsFromConvex === undefined;

    return {
      cafes,
      neighborhoods,
      isLoading,
    };
  }, [cafesFromConvex, neighborhoodsFromConvex]);
}

export function useCafeById(id) {
  const { cafes, isLoading } = useBackendData();
  const cafe = useMemo(() => cafes.find((c) => c.id === id), [cafes, id]);

  return { cafe, isLoading };
}
