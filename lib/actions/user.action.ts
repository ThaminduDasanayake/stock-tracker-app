"use server";

import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export interface OnboardingPreferences {
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
}

export const getUserOnboardingStatus = async (): Promise<{
  isOnboarded: boolean;
  preferences?: OnboardingPreferences;
}> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { isOnboarded: true }; // Don't trigger for unauthenticated users

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return { isOnboarded: true };

    const dbUser = await db.collection("user").findOne({
      $or: [
        { _id: session.user.id as any },
        { id: session.user.id },
        { email: session.user.email },
      ],
    });

    if (!dbUser) return { isOnboarded: false };

    const isOnboarded =
      !!dbUser.onboardingCompleted ||
      (!!dbUser.country &&
        !!dbUser.investmentGoals &&
        !!dbUser.riskTolerance &&
        !!dbUser.preferredIndustry);

    return {
      isOnboarded,
      preferences: isOnboarded
        ? {
            country: dbUser.country || "US",
            investmentGoals: dbUser.investmentGoals || "Growth",
            riskTolerance: dbUser.riskTolerance || "Medium",
            preferredIndustry: dbUser.preferredIndustry || "Technology",
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return { isOnboarded: true };
  }
};

export const saveUserOnboardingPreferences = async (
  preferences: OnboardingPreferences
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return { success: false, error: "Database connection failed." };
    }

    const { country, investmentGoals, riskTolerance, preferredIndustry } =
      preferences;

    // Update MongoDB user profile
    await db.collection("user").updateOne(
      {
        $or: [
          { _id: session.user.id as any },
          { id: session.user.id },
          { email: session.user.email },
        ],
      },
      {
        $set: {
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      }
    );

    // Trigger Inngest welcome email event with AI intro generation
    try {
      await inngest.send({
        name: "app/user.created",
        data: {
          email: session.user.email,
          name: session.user.name,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        },
      });
    } catch (inngestErr) {
      console.error("Inngest event send error:", inngestErr);
    }

    revalidatePath("/");
    return {
      success: true,
      message: "Investment profile saved successfully!",
    };
  } catch (error) {
    console.error("Error saving onboarding preferences:", error);
    return { success: false, error: "Failed to save preferences." };
  }
};

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongoose connection not connected");

    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();

    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id?.toString() || "",
        name: user.name,
        email: user.email,
      }));
  } catch (error) {
    console.error("Error fetching users for news email", error);
    return [];
  }
};

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image?: string;
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
  createdAt?: string;
}

export const getUserProfile = async (): Promise<UserProfileData | null> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return null;

    const dbUser = await db.collection("user").findOne({
      $or: [
        { _id: session.user.id as any },
        { id: session.user.id },
        { email: session.user.email },
      ],
    });

    if (!dbUser) return null;

    return {
      id: String(dbUser.id || dbUser._id),
      name: String(dbUser.name || session.user.name || "User"),
      email: String(dbUser.email || session.user.email),
      image: dbUser.image || session.user.image || undefined,
      country: dbUser.country || "US",
      investmentGoals: dbUser.investmentGoals || "Growth",
      riskTolerance: dbUser.riskTolerance || "Medium",
      preferredIndustry: dbUser.preferredIndustry || "Technology",
      createdAt: dbUser.createdAt
        ? new Date(dbUser.createdAt).toISOString()
        : undefined,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (preferences: OnboardingPreferences) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return { success: false, error: "Database connection failed." };
    }

    const { country, investmentGoals, riskTolerance, preferredIndustry } =
      preferences;

    await db.collection("user").updateOne(
      {
        $or: [
          { _id: session.user.id as any },
          { id: session.user.id },
          { email: session.user.email },
        ],
      },
      {
        $set: {
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath("/profile");
    revalidatePath("/");
    return {
      success: true,
      message: "Preferences updated successfully!",
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile." };
  }
};
