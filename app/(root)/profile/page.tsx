import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/user.action";
import { getUserAlerts } from "@/lib/actions/alert.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfilePreferencesForm from "@/components/ProfilePreferencesForm";
import AlertsManager from "@/components/AlertsManager";
import { Sliders, Bell, User, Calendar, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  const alerts = await getUserAlerts();

  const initialPreferences = {
    country: profile.country || "US",
    investmentGoals: profile.investmentGoals || "Growth",
    riskTolerance: profile.riskTolerance || "Medium",
    preferredIndustry: profile.preferredIndustry || "Technology",
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-800/80 border border-gray-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-yellow-500/40 shadow-xl">
            <AvatarImage
              src={profile.image}
              alt={profile.name}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-yellow-500 text-yellow-950 text-2xl font-bold">
              {profile.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {profile.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Google Verified
              </span>
            </div>
            <p className="text-gray-400 text-sm">{profile.email}</p>

            {profile.createdAt && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-10">
        {/* Investment Preferences Section */}
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
            <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Investment Preferences
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Configure your strategy to customize Gemini AI market digests and recommendations.
              </p>
            </div>
          </div>

          <ProfilePreferencesForm initialPreferences={initialPreferences} />
        </section>

        {/* Price Alerts Section */}
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Stock Price Alerts ({alerts.length})
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Manage upper and lower price threshold alerts. Automated notifications are sent via email.
                </p>
              </div>
            </div>
          </div>

          <AlertsManager initialAlerts={alerts} />
        </section>
      </div>
    </div>
  );
}
