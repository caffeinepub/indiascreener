import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BookMarked,
  Briefcase,
  GitCompare,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  TrendingUp,
} from "lucide-react";
import FreshnessBadge from "../components/FreshnessBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMarketData } from "../lib/yahooFinance";

export default function Navbar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const location = useLocation();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const { freshness } = useMarketData();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navLinks = [
    { to: "/screener", label: "Screener", icon: LayoutDashboard },
    { to: "/screener-ideas", label: "Ideas", icon: Lightbulb },
    { to: "/compare", label: "Compare", icon: GitCompare },
    { to: "/watchlist", label: "Watchlist", icon: BookMarked },
    { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  ];

  return (
    <header className="bg-nav border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          data-ocid="nav.link"
        >
          <div className="w-7 h-7 rounded bg-primary/80 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-nav text-lg font-normal tracking-tight">
            IndiaScreener
          </span>
        </Link>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-ocid={`nav.${label.toLowerCase()}.link`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors shrink-0 ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <FreshnessBadge freshness={freshness} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuth}
            disabled={isLoggingIn}
            data-ocid="nav.auth.button"
            className="text-nav border-white/30 bg-transparent hover:bg-white/10 hover:text-white"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : isAuthenticated ? (
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isLoggingIn
              ? "Signing in..."
              : isAuthenticated
                ? "Logout"
                : "Login"}
          </Button>
        </div>
      </div>
    </header>
  );
}
