"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
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

export async function addToWatchlist({
  symbol,
  company,
}: {
  symbol: string;
  company?: string;
}) {
  if (!symbol) return { success: false, error: "Symbol is required" };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Unauthorized. Please sign in." };

    await connectToDatabase();
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = (company || symbol).trim();

    await Watchlist.findOneAndUpdate(
      { userId: user.id, symbol: cleanSymbol },
      {
        userId: user.id,
        symbol: cleanSymbol,
        company: cleanCompany,
        addedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    revalidatePath(`/stocks/${cleanSymbol}`);
    revalidatePath("/watchlist");
    revalidatePath("/");

    return { success: true, message: `${cleanSymbol} added to watchlist` };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return { success: false, error: "Failed to add to watchlist" };
  }
}

export async function removeFromWatchlist({ symbol }: { symbol: string }) {
  if (!symbol) return { success: false, error: "Symbol is required" };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Unauthorized. Please sign in." };

    await connectToDatabase();
    const cleanSymbol = symbol.trim().toUpperCase();

    await Watchlist.deleteOne({ userId: user.id, symbol: cleanSymbol });

    revalidatePath(`/stocks/${cleanSymbol}`);
    revalidatePath("/watchlist");
    revalidatePath("/");

    return { success: true, message: `${cleanSymbol} removed from watchlist` };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return { success: false, error: "Failed to remove from watchlist" };
  }
}

export async function isStockInWatchlist(symbol: string): Promise<boolean> {
  if (!symbol) return false;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    await connectToDatabase();
    const cleanSymbol = symbol.trim().toUpperCase();

    const exists = await Watchlist.exists({
      userId: user.id,
      symbol: cleanSymbol,
    });

    return !!exists;
  } catch (error) {
    console.error("Error checking watchlist status:", error);
    return false;
  }
}

export async function getUserWatchlist() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    await connectToDatabase();
    const items = await Watchlist.find({ userId: user.id })
      .sort({ addedAt: -1 })
      .lean();

    return items.map((item) => ({
      id: String(item._id),
      symbol: String(item.symbol),
      company: String(item.company),
      addedAt: item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    return [];
  }
}

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}
