import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { getUserOnboardingStatus } from "@/lib/actions/user.action";
import OnboardingModal from "@/components/OnboardingModal";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  let userImage = session.user.image;

  // If user image is not present in session, retrieve and sync from Google account
  if (!userImage) {
    try {
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;

      if (db) {
        // 1. Check user collection in MongoDB
        const dbUser = await db.collection("user").findOne({
          $or: [
            { _id: session.user.id as any },
            { id: session.user.id },
            { email: session.user.email },
          ],
        });

        if (dbUser?.image) {
          userImage = dbUser.image;
        } else {
          // 2. Check linked Google account in account collection
          const googleAccount = await db.collection("account").findOne({
            $or: [
              { userId: session.user.id, providerId: "google" },
              { userId: dbUser?._id, providerId: "google" },
              { providerId: "google" },
            ],
          });

          // Extract picture from Google ID token
          if (googleAccount?.idToken) {
            try {
              const parts = googleAccount.idToken.split(".");
              if (parts.length >= 2) {
                const payload = JSON.parse(
                  Buffer.from(parts[1], "base64url").toString("utf-8")
                );
                if (payload.picture) {
                  userImage = payload.picture;
                }
              }
            } catch (err) {
              console.error("Failed to parse Google idToken:", err);
            }
          }

          // Fallback: fetch user info directly using Google access token
          if (!userImage && googleAccount?.accessToken) {
            try {
              const res = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                  headers: {
                    Authorization: `Bearer ${googleAccount.accessToken}`,
                  },
                }
              );
              if (res.ok) {
                const data = await res.json();
                if (data.picture) {
                  userImage = data.picture;
                }
              }
            } catch (err) {
              console.error("Failed to fetch Google userinfo:", err);
            }
          }

          // If picture found, save it to the user document in MongoDB
          if (userImage) {
            await db
              .collection("user")
              .updateOne(
                { email: session.user.email },
                { $set: { image: userImage } }
              );
          }
        }
      }
    } catch (e) {
      console.error("Error retrieving user avatar image:", e);
    }
  }

  // Check onboarding status
  const { isOnboarded } = await getUserOnboardingStatus();

  const user: User = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: userImage || undefined,
  };

  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} />
      <div className="container py-10">{children}</div>
      <OnboardingModal initialOpen={!isOnboarded} />
    </main>
  );
};

export default Layout;
