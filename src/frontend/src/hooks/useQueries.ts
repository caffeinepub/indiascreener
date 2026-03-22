import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Financial, PortfolioEntry, Watchlist } from "../backend.d";
import {
  COMPANIES,
  type Company,
  SECTORS,
  filterCompanies,
  getCompany,
} from "../data/companiesData";
import { useActor } from "./useActor";

export function useAllCompanies() {
  return useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () =>
      [...COMPANIES].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useCompany(symbol: string) {
  return useQuery<Company>({
    queryKey: ["company", symbol],
    queryFn: () => {
      const c = getCompany(symbol);
      if (!c) throw new Error("Company not found");
      return c;
    },
    enabled: !!symbol,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useCompaniesBySector(sector: string) {
  return useQuery<Company[]>({
    queryKey: ["companies", "sector", sector],
    queryFn: () => COMPANIES.filter((c) => c.sector === sector),
    enabled: !!sector,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSectors() {
  return useQuery<string[]>({
    queryKey: ["sectors"],
    queryFn: () => SECTORS,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useScreenStocks(
  params: {
    minPE: number | null;
    maxPE: number | null;
    minROE: number | null;
    minROCE: number | null;
    minMarketCap: number | null;
    maxMarketCap: number | null;
    minPB: number | null;
    maxPB: number | null;
    maxDebtEquity: number | null;
    sector: string | null;
  },
  enabled: boolean,
) {
  return useQuery<Company[]>({
    queryKey: ["screener", params],
    queryFn: () => filterCompanies(params),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useFinancials(companyId: number | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Financial[]>({
    queryKey: ["financials", companyId?.toString()],
    queryFn: async () => {
      if (!actor || companyId == null) return [];
      return actor.getFinancials(BigInt(companyId));
    },
    enabled: !!actor && !isFetching && companyId != null,
  });
}

export function useUserWatchlists() {
  const { actor, isFetching } = useActor();
  return useQuery<Watchlist[]>({
    queryKey: ["watchlists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserWatchlists();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserPortfolio() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioEntry[]>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserPortfolio();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not logged in");
      return actor.createWatchlist(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      watchlistId,
      symbol,
    }: { watchlistId: bigint; symbol: string }) => {
      if (!actor) throw new Error("Not logged in");
      return actor.addToWatchlist(watchlistId, symbol);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      watchlistId,
      symbol,
    }: { watchlistId: bigint; symbol: string }) => {
      if (!actor) throw new Error("Not logged in");
      return actor.removeFromWatchlist(watchlistId, symbol);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useDeleteWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (watchlistId: bigint) => {
      if (!actor) throw new Error("Not logged in");
      return actor.deleteWatchlist(watchlistId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useAddPortfolioEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      symbol: string;
      companyName: string;
      quantity: number;
      avgCost: number;
      buyDate: string;
    }) => {
      if (!actor) throw new Error("Not logged in");
      return actor.addPortfolioEntry(
        entry.symbol,
        entry.companyName,
        entry.quantity,
        entry.avgCost,
        entry.buyDate,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useRemovePortfolioEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Not logged in");
      return actor.removePortfolioEntry(entryId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}
