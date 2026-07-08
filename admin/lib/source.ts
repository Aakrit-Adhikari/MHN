import type { Inquiry, SourceType } from "@/types/api";

export type SourceOption = {
  label: string;
  sourceType: SourceType;
  sourceName: string;
  sourceMedium?: string;
  utmSource?: string;
  utmMedium?: string;
};

export const sourceTypeOptions: { value: SourceType; label: string }[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "ADS", label: "Ads" },
  { value: "SOCIAL", label: "Social" },
  { value: "OTA", label: "OTA" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE", label: "Phone Call" },
  { value: "REFERRAL", label: "Referral" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "MANUAL", label: "Manual" },
  { value: "OTHER", label: "Other" }
];

export const sourceOptions: SourceOption[] = [
  {
    label: "Website",
    sourceType: "WEBSITE",
    sourceName: "Mountain Helicopters Website",
    sourceMedium: "organic",
    utmSource: "website"
  },
  {
    label: "Facebook Ads",
    sourceType: "ADS",
    sourceName: "Facebook",
    sourceMedium: "paid_social",
    utmSource: "facebook",
    utmMedium: "paid_social"
  },
  {
    label: "Instagram Ads",
    sourceType: "ADS",
    sourceName: "Instagram",
    sourceMedium: "paid_social",
    utmSource: "instagram",
    utmMedium: "paid_social"
  },
  {
    label: "Google Ads",
    sourceType: "ADS",
    sourceName: "Google",
    sourceMedium: "paid_search",
    utmSource: "google",
    utmMedium: "paid_search"
  },
  { label: "WhatsApp", sourceType: "WHATSAPP", sourceName: "WhatsApp" },
  { label: "Phone", sourceType: "PHONE", sourceName: "Phone Call" },
  { label: "Referral", sourceType: "REFERRAL", sourceName: "Referral" },
  { label: "Walk-in", sourceType: "WALK_IN", sourceName: "Walk-in" },
  { label: "MakeMyTrip", sourceType: "OTA", sourceName: "MakeMyTrip" },
  { label: "Booking.com", sourceType: "OTA", sourceName: "Booking.com" },
  { label: "TripAdvisor", sourceType: "OTA", sourceName: "TripAdvisor" },
  { label: "GetYourGuide", sourceType: "OTA", sourceName: "GetYourGuide" },
  { label: "Viator", sourceType: "OTA", sourceName: "Viator" },
  { label: "Manual", sourceType: "MANUAL", sourceName: "Manual Admin Entry" },
  { label: "Other", sourceType: "OTHER", sourceName: "Other" }
];

export function getSourceLabel(item: Pick<Inquiry, "sourceName" | "sourceType" | "utmSource">) {
  if (item.sourceName) return item.sourceName;
  if (item.utmSource) return item.utmSource;
  if (item.sourceType) return sourceTypeOptions.find((option) => option.value === item.sourceType)?.label ?? item.sourceType;
  return "Unknown";
}

export function getSourceBadgeClass(sourceType: SourceType | null | undefined) {
  if (sourceType === "ADS" || sourceType === "OTA") return "badge-gold";
  if (sourceType === "WEBSITE" || sourceType === "SOCIAL") return "badge-blue";
  if (sourceType === "REFERRAL" || sourceType === "WHATSAPP") return "badge-green";
  return "badge-grey";
}
