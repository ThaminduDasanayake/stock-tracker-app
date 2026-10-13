"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.action";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !added;
    setAdded(nextState);

    startTransition(async () => {
      try {
        const result = nextState
          ? await addToWatchlist({ symbol, company })
          : await removeFromWatchlist({ symbol });

        if (result.success) {
          toast.success(result.message);
          onWatchlistChange?.(symbol, nextState);
        } else {
          // Revert optimistic state on failure
          setAdded(!nextState);
          toast.error(result.error || "Failed to update watchlist");
        }
      } catch (err) {
        setAdded(!nextState);
        console.error("Watchlist action error:", err);
        toast.error("Something went wrong while updating watchlist");
      }
    });
  };

  if (type === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        title={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        aria-label={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={added ? "#FACC15" : "none"}
            stroke="#FACC15"
            strokeWidth="1.5"
            className="watchlist-star"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
            />
          </svg>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={added ? "destructive" : "default"}
      disabled={isPending}
      className={`watchlist-btn ${added ? "watchlist-remove" : ""} cursor-pointer`}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      ) : showTrashIcon && added ? (
        <Trash2 className="w-4 h-4 mr-2" />
      ) : null}
      <span>{isPending ? (added ? "Adding..." : "Removing...") : label}</span>
    </Button>
  );
};

export default WatchlistButton;
