"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
  createPriceAlert,
  getCurrentStockQuote,
} from "@/lib/actions/alert.action";
import { toast } from "sonner";

interface AlertModalProps {
  symbol: string;
  company?: string;
  currentPrice?: number;
  triggerButton?: React.ReactNode;
}

export const AlertModal = ({
  symbol,
  company,
  currentPrice: initialPrice,
  triggerButton,
}: AlertModalProps) => {
  const [open, setOpen] = useState(false);
  const [alertName, setAlertName] = useState(`${symbol.toUpperCase()} Target Alert`);
  const [alertType, setAlertType] = useState<"upper" | "lower">("upper");
  const [threshold, setThreshold] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(initialPrice ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentPrice === null) {
      getCurrentStockQuote(symbol).then((price) => {
        if (price) {
          setCurrentPrice(price);
          setThreshold(price.toFixed(2));
        }
      });
    }
  }, [open, symbol, currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numThreshold = parseFloat(threshold);
    if (!numThreshold || isNaN(numThreshold) || numThreshold <= 0) {
      toast.error("Please enter a valid price threshold");
      return;
    }

    setLoading(true);
    try {
      const res = await createPriceAlert({
        symbol,
        company: company || symbol,
        alertName,
        alertType,
        threshold: numThreshold,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to set alert");
      }
    } catch (err) {
      console.error("Alert submission error:", err);
      toast.error("Something went wrong while setting alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <button type="button" className="add-alert">
            <Bell className="w-4 h-4 text-yellow-500" />
            <span>Set Alert</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 sm:max-w-[440px] p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Bell className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-100">
              Set Price Alert for {symbol.toUpperCase()}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-400">
            Receive an email notification when {company || symbol} hits your target price.
          </DialogDescription>
        </DialogHeader>

        {currentPrice !== null && (
          <div className="p-3 my-2 rounded-lg bg-gray-800/80 border border-gray-700/60 flex items-center justify-between text-sm">
            <span className="text-gray-400">Current Market Price:</span>
            <span className="font-bold text-yellow-500 font-mono text-base">
              ${currentPrice.toFixed(2)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="alertName" className="text-sm text-gray-300">
              Alert Label
            </Label>
            <Input
              id="alertName"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g. Breakout Target"
              className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alertType" className="text-sm text-gray-300">
              Trigger Condition
            </Label>
            <Select
              value={alertType}
              onValueChange={(val: "upper" | "lower") => setAlertType(val)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="upper" className="focus:bg-gray-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>Price rises above or equal to (&gt;=)</span>
                  </div>
                </SelectItem>
                <SelectItem value="lower" className="focus:bg-gray-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span>Price drops below or equal to (&lt;=)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="threshold" className="text-sm text-gray-300">
              Target Price ($ USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="0.00"
                className="pl-7 bg-gray-800 border-gray-700 text-white font-mono focus:border-yellow-500"
                required
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="yellow-btn px-5 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting Alert...
                </>
              ) : (
                "Save Alert"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
