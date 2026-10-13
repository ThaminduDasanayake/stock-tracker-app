"use server";

import { connectToDatabase } from "@/database/mongoose";
import { AlertModel } from "@/database/models/alert.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function createPriceAlert({
  symbol,
  company,
  alertName,
  alertType,
  threshold,
}: {
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
}) {
  if (!symbol || !threshold || isNaN(threshold)) {
    return { success: false, error: "Valid symbol and target price are required" };
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Unauthorized. Please sign in." };

    await connectToDatabase();
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = (company || symbol).trim();
    const cleanName = (alertName || `${cleanSymbol} Price Alert`).trim();

    await AlertModel.create({
      userId: user.id,
      symbol: cleanSymbol,
      company: cleanCompany,
      alertName: cleanName,
      alertType,
      threshold: Number(threshold),
      isActive: true,
      createdAt: new Date(),
    });

    revalidatePath(`/stocks/${cleanSymbol}`);
    revalidatePath("/watchlist");
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: `Alert set for ${cleanSymbol} when price ${
        alertType === "upper" ? "rises above" : "drops below"
      } $${Number(threshold).toFixed(2)}`,
    };
  } catch (error) {
    console.error("Error creating price alert:", error);
    return { success: false, error: "Failed to create price alert" };
  }
}

export async function getUserAlerts(symbol?: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    await connectToDatabase();
    const query: Record<string, unknown> = { userId: user.id };
    if (symbol) {
      query.symbol = symbol.trim().toUpperCase();
    }

    const items = await AlertModel.find(query).sort({ createdAt: -1 }).lean();

    return items.map((item) => ({
      id: String(item._id),
      symbol: String(item.symbol),
      company: String(item.company),
      alertName: String(item.alertName),
      alertType: item.alertType as "upper" | "lower",
      threshold: Number(item.threshold),
      isActive: Boolean(item.isActive),
      lastTriggeredAt: item.lastTriggeredAt
        ? new Date(item.lastTriggeredAt).toISOString()
        : null,
      createdAt: new Date(item.createdAt).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    return [];
  }
}

export async function deletePriceAlert(alertId: string) {
  if (!alertId) return { success: false, error: "Alert ID required" };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Unauthorized" };

    await connectToDatabase();
    await AlertModel.deleteOne({ _id: alertId, userId: user.id });

    revalidatePath("/watchlist");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, message: "Alert removed successfully" };
  } catch (error) {
    console.error("Error deleting alert:", error);
    return { success: false, error: "Failed to delete alert" };
  }
}

export async function toggleAlertStatus(alertId: string, isActive: boolean) {
  if (!alertId) return { success: false, error: "Alert ID required" };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Unauthorized" };

    await connectToDatabase();
    await AlertModel.updateOne(
      { _id: alertId, userId: user.id },
      { $set: { isActive } }
    );

    revalidatePath("/watchlist");
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: isActive ? "Alert activated" : "Alert paused",
    };
  } catch (error) {
    console.error("Error toggling alert status:", error);
    return { success: false, error: "Failed to update alert" };
  }
}

export async function getCurrentStockQuote(symbol: string): Promise<number | null> {
  try {
    const token =
      process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return null;

    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
        symbol.trim().toUpperCase()
      )}&token=${token}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.c === "number" && data.c > 0 ? data.c : null;
  } catch {
    return null;
  }
}
