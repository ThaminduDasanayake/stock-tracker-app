"use client";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { Loader2, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import WatchlistButton from "./WatchlistButton";

const SearchCommand = ({
  renderAs = "button",
  label = "Search stocks...",
  initialStocks,
}: SearchCommandProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  };

  return (
    <>
      {renderAs === "text" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-1.5 font-medium text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer bg-transparent border-0 p-0 text-base"
        >
          <Search className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-all duration-200 group-hover:scale-110" />
          <span>{label}</span>
        </button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="search-btn transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10 hover:brightness-105 active:scale-95"
        >
          <Search className="w-4 h-4 mr-1.5" />
          {label}
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog shadow-2xl backdrop-blur-sm"
      >
        <div className="search-field group">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search symbols or company name (e.g. AAPL, NVDA, TSLA)..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader text-yellow-500" />}
        </div>

        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty py-8 text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
              <span>Fetching stocks...</span>
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="search-list-indicator py-8 text-center text-gray-500">
              {isSearchMode
                ? "No stocks found for that query"
                : "No stocks available"}
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              <div className="search-count rounded-md mb-2">
                {isSearchMode ? "Search results" : "Popular stocks"}{" "}
                <span className="text-yellow-500 font-semibold">
                  ({displayStocks?.length || 0})
                </span>
              </div>
              {displayStocks?.map((stock) => (
                <li
                  key={stock.symbol}
                  className="group flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:bg-gray-700/50 hover:border-gray-600 border border-transparent"
                >
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="flex-1 flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <div className="p-2 rounded-md bg-gray-700/60 text-gray-400 group-hover:text-yellow-400 group-hover:bg-yellow-500/10 transition-colors">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-base text-gray-300 group-hover:text-yellow-400 transition-colors">
                        {stock.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        <span className="text-gray-300 font-semibold">
                          {stock.symbol}
                        </span>{" "}
                        · {stock.exchange} · {stock.type}
                      </div>
                    </div>
                  </Link>

                  <div className="ml-2">
                    <WatchlistButton
                      symbol={stock.symbol}
                      company={stock.name}
                      isInWatchlist={stock.isInWatchlist}
                      type="icon"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchCommand;
