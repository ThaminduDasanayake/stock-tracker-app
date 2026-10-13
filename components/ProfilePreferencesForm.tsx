"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import {
  updateUserProfile,
  OnboardingPreferences,
} from "@/lib/actions/user.action";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProfilePreferencesFormProps {
  initialPreferences: OnboardingPreferences;
}

export default function ProfilePreferencesForm({
  initialPreferences,
}: ProfilePreferencesFormProps) {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<OnboardingPreferences>({
    defaultValues: initialPreferences,
  });

  const onSubmit = async (data: OnboardingPreferences) => {
    try {
      const res = await updateUserProfile(data);
      if (res.success) {
        toast.success(res.message);
        reset(data); // update dirty state
      } else {
        toast.error(res.error || "Failed to update profile preferences");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("An error occurred while updating your preferences.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountrySelectField
          name="country"
          label="Country / Region"
          control={control}
          error={errors.country}
          required
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your goal"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />

        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select risk profile"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />

        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select preferred sector"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="yellow-btn flex items-center gap-2 px-6 py-2.5 font-medium disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
