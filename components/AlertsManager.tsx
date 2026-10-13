"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  Trash2,
  TrendingUp,
  TrendingDown,
  Power,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deletePriceAlert,
  toggleAlertStatus,
} from "@/lib/actions/alert.action";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/utils";

export interface AlertItemDisplay {
  id: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

interface AlertsManagerProps {
  initialAlerts: AlertItemDisplay[];
}

export default function AlertsManager({ initialAlerts }: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<AlertItemDisplay[]>(initialAlerts);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: nextStatus } : a))
    );

    startTransition(async () => {
      try {
        const res = await toggleAlertStatus(id, nextStatus);
        if (res.success) {
          toast.success(res.message);
        } else {
          // Revert
          setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, isActive: currentStatus } : a))
          );
          toast.error(res.error || "Failed to update alert");
        }
      } catch (err) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isActive: currentStatus } : a))
        );
        toast.error("Failed to update alert status");
      }
    });
  };

  const handleDelete = (id: string, symbol: string) => {
    const prevAlerts = [...alerts];
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    startTransition(async () => {
      try {
        const res = await deletePriceAlert(id);
        if (res.success) {
          toast.success(`${symbol} alert deleted`);
        } else {
          setAlerts(prevAlerts);
          toast.error(res.error || "Failed to delete alert");
        }
      } catch (err) {
        setAlerts(prevAlerts);
        toast.error("Failed to delete alert");
      }
    });
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Price Alerts Set</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          You haven&apos;t set any price thresholds yet. Head over to any stock page
          or your watchlist to set upper or lower price alerts.
        </p>
        <Link
          href="/watchlist"
          className="inline-flex items-center gap-2 yellow-btn px-5 py-2 text-sm font-semibold rounded-lg"
        >
          View Watchlist
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const isUpper = alert.alertType === "upper";
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.isActive
                  ? "bg-gray-900/80 border-gray-800 hover:border-gray-700"
                  : "bg-gray-950/60 border-gray-900 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      isUpper
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isUpper ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stocks/${alert.symbol}`}
                        className="font-bold text-white hover:text-yellow-400 transition-colors flex items-center gap-1 group"
                      >
                        {alert.symbol}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                      </Link>
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">
                        {alert.company}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alert.alertName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggle(alert.id, alert.isActive)}
                    title={alert.isActive ? "Pause alert" : "Activate alert"}
                    className={`h-8 w-8 p-0 rounded-lg hover:bg-gray-800 ${
                      alert.isActive
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(alert.id, alert.symbol)}
                    title="Delete alert"
                    className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Target:</span>
                  <span
                    className={`font-semibold ${
                      isUpper ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUpper ? "≥" : "≤"} ${alert.threshold.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {alert.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : alert.lastTriggeredAt ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Triggered {formatTimeAgo(alert.lastTriggeredAt)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                      Paused
                    </span>
                  )}
                  <span className="text-gray-500 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(alert.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
