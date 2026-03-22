import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { BookMarked, Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import LoginPrompt from "../components/LoginPrompt";
import TickerBadge from "../components/TickerBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllCompanies,
  useCreateWatchlist,
  useDeleteWatchlist,
  useRemoveFromWatchlist,
  useUserWatchlists,
} from "../hooks/useQueries";
import { formatCurrency, formatRatio } from "../lib/formatters";

export default function WatchlistPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: watchlists = [], isLoading } = useUserWatchlists();
  const { data: companies = [] } = useAllCompanies();
  const createWatchlist = useCreateWatchlist();
  const deleteWatchlist = useDeleteWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  if (!isAuthenticated) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <LoginPrompt
          title="Watchlist"
          description="Sign in to create and manage your watchlists."
        />
      </main>
    );
  }

  const companyMap = Object.fromEntries(companies.map((c) => [c.symbol, c]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createWatchlist.mutateAsync(newName.trim());
      toast.success(`Watchlist "${newName}" created`);
      setNewName("");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create watchlist");
    }
  };

  const handleDelete = async (id: bigint, name: string) => {
    try {
      await deleteWatchlist.mutateAsync(id);
      toast.success(`Deleted watchlist "${name}"`);
    } catch {
      toast.error("Failed to delete watchlist");
    }
  };

  const handleRemoveStock = async (watchlistId: bigint, symbol: string) => {
    try {
      await removeFromWatchlist.mutateAsync({ watchlistId, symbol });
      toast.success(`Removed ${symbol}`);
    } catch {
      toast.error("Failed to remove stock");
    }
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display">Watchlists</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track stocks you&apos;re interested in
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                data-ocid="watchlist.create.open_modal_button"
                className="h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="watchlist.create.dialog">
              <DialogHeader>
                <DialogTitle>Create Watchlist</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 py-2">
                <Input
                  data-ocid="watchlist.create.input"
                  placeholder="Watchlist name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreate}
                  disabled={createWatchlist.isPending || !newName.trim()}
                  data-ocid="watchlist.create.submit_button"
                >
                  {createWatchlist.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="watchlist.loading_state">
            {Array.from({ length: 2 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : watchlists.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-3"
            data-ocid="watchlist.empty_state"
          >
            <BookMarked className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No watchlists yet.</p>
            <p className="text-xs text-muted-foreground">
              Create one to start tracking stocks.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {watchlists.map((wl, wlIdx) => (
                <motion.div
                  key={wl.id.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: wlIdx * 0.05 }}
                  className="bg-card border border-border rounded-lg overflow-hidden shadow-xs"
                  data-ocid={`watchlist.item.${wlIdx + 1}`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm">{wl.name}</h2>
                      <span className="text-xs text-muted-foreground">
                        {wl.symbols.length} stocks
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid="watchlist.delete.open_modal_button"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-negative"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="watchlist.delete.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Watchlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{wl.name}&quot;
                            and all its tracked stocks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="watchlist.delete.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(wl.id, wl.name)}
                            data-ocid="watchlist.delete.confirm_button"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {wl.symbols.length === 0 ? (
                    <div
                      className="text-center py-8 text-sm text-muted-foreground"
                      data-ocid="watchlist.stocks.empty_state"
                    >
                      No stocks in this watchlist. Search for a company and add
                      it.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                          <TableHead className="text-xs text-muted-foreground">
                            Symbol
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground">
                            Name
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground">
                            Price
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground">
                            PE
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground">
                            ROE%
                          </TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wl.symbols.map((sym, sIdx) => {
                          const co = companyMap[sym];
                          return (
                            <TableRow
                              key={sym}
                              className="border-b border-border/50"
                              data-ocid={`watchlist.stock.item.${sIdx + 1}`}
                            >
                              <TableCell className="py-2">
                                <button
                                  type="button"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    navigate({
                                      to: "/company/$symbol",
                                      params: { symbol: sym },
                                    })
                                  }
                                >
                                  <TickerBadge symbol={sym} />
                                </button>
                              </TableCell>
                              <TableCell className="text-sm py-2">
                                {co?.name ?? sym}
                              </TableCell>
                              <TableCell className="text-sm font-mono-data py-2">
                                {co ? formatCurrency(co.price) : "—"}
                              </TableCell>
                              <TableCell className="text-sm font-mono-data py-2">
                                {co ? formatRatio(co.pe) : "—"}
                              </TableCell>
                              <TableCell
                                className={`text-sm font-mono-data py-2 ${
                                  co && co.roe >= 15 ? "text-positive" : ""
                                }`}
                              >
                                {co ? `${co.roe.toFixed(1)}%` : "—"}
                              </TableCell>
                              <TableCell className="py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-negative"
                                  onClick={() => handleRemoveStock(wl.id, sym)}
                                  data-ocid={`watchlist.stock.delete_button.${sIdx + 1}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
}
