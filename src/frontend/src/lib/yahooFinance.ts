import { useCallback, useEffect, useRef, useState } from "react";
import { COMPANIES, type Company } from "../data/companiesData";
import { useActor } from "../hooks/useActor";

export interface LiveQuote {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  marketCap?: number;
  pe?: number;
  high52w?: number;
  low52w?: number;
  dataSource: string;
  lastUpdated: bigint;
}

type Freshness = "live" | "cached" | "offline";

const CACHE_KEY = "indiaScreener_quotes";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CachePayload {
  fetchedAt: number;
  quotes: Record<string, LiveQuote>;
}

function readCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachePayload;
  } catch {
    return null;
  }
}

function writeCache(quotes: Record<string, LiveQuote>): void {
  try {
    const payload: CachePayload = { fetchedAt: Date.now(), quotes };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function isCacheValid(payload: CachePayload): boolean {
  return Date.now() - payload.fetchedAt < CACHE_TTL_MS;
}

const NSE_SYMBOLS = COMPANIES.map((c) => c.symbol);
const INDEX_SYMBOLS = ["^NSEI", "^BSESN"];
const ALL_SYMBOLS = [...INDEX_SYMBOLS, ...NSE_SYMBOLS];

export function getMergedCompany(
  staticCompany: Company,
  quote?: LiveQuote,
): Company {
  if (!quote || quote.dataSource === "offline") return staticCompany;
  return {
    ...staticCompany,
    price: quote.price ?? staticCompany.price,
    marketCap: quote.marketCap ?? staticCompany.marketCap,
    pe: quote.pe ?? staticCompany.pe,
    high52w: quote.high52w ?? staticCompany.high52w,
    low52w: quote.low52w ?? staticCompany.low52w,
  };
}

function buildOfflineMap(): Map<string, LiveQuote> {
  const map = new Map<string, LiveQuote>();
  for (const company of COMPANIES) {
    map.set(company.symbol, {
      symbol: company.symbol,
      price: company.price,
      marketCap: company.marketCap,
      pe: company.pe,
      high52w: company.high52w,
      low52w: company.low52w,
      change: 0,
      changePercent: 0,
      dataSource: "offline",
      lastUpdated: BigInt(Date.now()),
    });
  }
  return map;
}

export function useMarketData() {
  const { actor, isFetching } = useActor();
  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [freshness, setFreshness] = useState<Freshness>("offline");
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(
    async (forceRefresh = false) => {
      // Check cache first
      if (!forceRefresh) {
        const cached = readCache();
        if (cached && isCacheValid(cached)) {
          const map = new Map(
            Object.entries(cached.quotes).map(([k, q]) => [
              k,
              { ...q, dataSource: "cached" as const },
            ]),
          );
          setQuotes(map);
          setFreshness("cached");
          setLoading(false);
          return;
        }
      }

      if (!actor || isFetching) {
        setQuotes(buildOfflineMap());
        setFreshness("offline");
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.allSettled(
          ALL_SYMBOLS.map((sym) => actor.fetchLiveQuote(sym)),
        );

        const map = new Map<string, LiveQuote>();
        const cacheObj: Record<string, LiveQuote> = {};
        let anyLive = false;

        for (let idx = 0; idx < results.length; idx++) {
          const result = results[idx];
          const sym = ALL_SYMBOLS[idx];
          if (result.status === "fulfilled") {
            const q = result.value as LiveQuote;
            map.set(sym, q);
            cacheObj[sym] = q;
            if (q.dataSource === "live") anyLive = true;
          } else {
            const company = COMPANIES.find((c) => c.symbol === sym);
            if (company) {
              const offlineQuote: LiveQuote = {
                symbol: sym,
                price: company.price,
                marketCap: company.marketCap,
                pe: company.pe,
                high52w: company.high52w,
                low52w: company.low52w,
                change: 0,
                changePercent: 0,
                dataSource: "offline",
                lastUpdated: BigInt(Date.now()),
              };
              map.set(sym, offlineQuote);
            }
          }
        }

        setQuotes(map);
        setFreshness(anyLive ? "live" : "cached");
        writeCache(cacheObj);
      } catch {
        setQuotes(buildOfflineMap());
        setFreshness("offline");
      } finally {
        setLoading(false);
      }
    },
    [actor, isFetching],
  );

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchQuotes(true), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQuotes]);

  return { quotes, freshness, loading };
}
