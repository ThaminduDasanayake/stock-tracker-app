"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import {
  saveUserOnboardingPreferences,
  OnboardingPreferences,
} from "@/lib/actions/user.action";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface OnboardingModalProps {
  initialOpen: boolean;
}

const OnboardingModal = ({ initialOpen }: OnboardingModalProps) => {
  const [open, setOpen] = useState(initialOpen);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingPreferences>({
    defaultValues: {
      country: "US",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
  });

  const onSubmit = async (data: OnboardingPreferences) => {
    try {
      const res = await saveUserOnboardingPreferences(data);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to save preferences");
      }
    } catch (err) {
      console.error("Onboarding submission error:", err);
      toast.error("Something went wrong while saving your preferences.");
    }
  };

  const handleSkip = async () => {
    try {
      await saveUserOnboardingPreferences({
        country: "US",
        investmentGoals: "Growth",
        riskTolerance: "Medium",
        preferredIndustry: "Technology",
      });
      setOpen(false);
    } catch {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="bg-gray-900 border-gray-700 text-gray-100 sm:max-w-[500px] p-6 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-100">
              Personalize Your Experience
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-400">
            Tell us about your investment strategy so Signalist and our AI can
            tailor news summaries, market alerts, and insights to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <CountrySelectField
            name="country"
            label="Country"
            control={control as any}
            error={errors.country}
            required
          />

          <SelectField
            name="investmentGoals"
            label="Investment Goals"
            placeholder="Select your goal"
            options={INVESTMENT_GOALS}
            control={control as any}
            error={errors.investmentGoals}
            required
          />

          <SelectField
            name="riskTolerance"
            label="Risk Tolerance"
            placeholder="Select your risk profile"
            options={RISK_TOLERANCE_OPTIONS}
            control={control as any}
            error={errors.riskTolerance}
            required
          />

          <SelectField
            name="preferredIndustry"
            label="Preferred Industry"
            placeholder="Select preferred sector"
            options={PREFERRED_INDUSTRIES}
            control={control as any}
            error={errors.preferredIndustry}
            required
          />

          <div className="pt-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              Skip for now
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="yellow-btn px-6 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
