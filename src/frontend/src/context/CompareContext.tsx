import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "indiaScreener_compare";
const MAX_COMPARE = 3;

interface CompareContextValue {
  compareList: string[];
  addToCompare: (symbol: string) => boolean; // returns true if added, false if max reached
  removeFromCompare: (symbol: string) => void;
  clearCompare: () => void;
  isInCompare: (symbol: string) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((symbol: string): boolean => {
    let added = false;
    setCompareList((prev) => {
      if (prev.includes(symbol)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      added = true;
      return [...prev, symbol];
    });
    // We check synchronously
    return added;
  }, []);

  const removeFromCompare = useCallback((symbol: string) => {
    setCompareList((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const isInCompare = useCallback(
    (symbol: string) => compareList.includes(symbol),
    [compareList],
  );

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
