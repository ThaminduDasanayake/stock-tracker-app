import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  // Resolve user avatar: prefer OAuth/database image, fallback to Gravatar based on email
  let userImage = session.user.image;
  if (!userImage && session.user.email) {
    const emailHash = crypto
      .createHash("md5")
      .update(session.user.email.trim().toLowerCase())
      .digest("hex");
    userImage = `https://www.gravatar.com/avatar/${emailHash}?d=mp`;
  }

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
    </main>
  );
};

export default Layout;
