import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Navbar from "./components/Navbar";
import TickerStrip from "./components/TickerStrip";
import { CompareProvider } from "./context/CompareContext";
import CompanyPage from "./pages/CompanyPage";
import ComparePage from "./pages/ComparePage";
import LandingPage from "./pages/LandingPage";
import PortfolioPage from "./pages/PortfolioPage";
import ScreenerIdeasPage from "./pages/ScreenerIdeasPage";
import ScreenerPage from "./pages/ScreenerPage";
import WatchlistPage from "./pages/WatchlistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <TickerStrip />
        <Navbar />
      </div>
      {/* offset for fixed ticker (32px) + navbar (56px) */}
      <div className="flex-1 pt-[88px]">
        <Outlet />
      </div>
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            &copy; {new Date().getFullYear()} IndiaScreener. Financial data for
            educational purposes only.
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const screenerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screener",
  component: ScreenerPage,
});

const companyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/company/$symbol",
  component: CompanyPage,
});

const watchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchlist",
  component: WatchlistPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: PortfolioPage,
});

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparePage,
});

const screenerIdeasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screener-ideas",
  component: ScreenerIdeasPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  screenerRoute,
  companyRoute,
  watchlistRoute,
  portfolioRoute,
  compareRoute,
  screenerIdeasRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompareProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </CompareProvider>
    </QueryClientProvider>
  );
}
