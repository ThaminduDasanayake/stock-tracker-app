"use client";

import { useState } from "react";
import { authClient } from "@/lib/better-auth/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Sign in failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to authenticate with Google",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="form-title mb-2">Welcome to Signalist</h1>
        <p className="text-gray-400 text-sm">
          Sign in to access your stock watchlist, market alerts, and
          personalized insights.
        </p>
      </div>

      <div className="pt-4">
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white font-medium text-base rounded-lg border border-gray-600 transition-colors flex items-center justify-center cursor-pointer shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin text-yellow-500" />
              Connecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center pt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default SignIn;
