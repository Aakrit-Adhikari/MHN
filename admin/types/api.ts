export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type User = {
  id: string;
  username: string;
  email?: string | null;
  name: string | null;
  role: AdminRole;
  status: UserStatus;
  permissions: PermissionKey[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "FINANCE" | "HR" | "OPERATIONS" | "EMPLOYEE" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "DISABLED";

export type PermissionKey =
  | "VIEW_DASHBOARD"
  | "VIEW_BOOKINGS"
  | "VIEW_TOURS"
  | "VIEW_BLOGS"
  | "VIEW_INQUIRIES"
  | "VIEW_CUSTOMERS"
  | "VIEW_FINANCE"
  | "VIEW_REPORTS"
  | "VIEW_NAVIGATION"
  | "VIEW_SETTINGS"
  | "VIEW_USERS";

export type Permission = {
  id?: string;
  name: string;
  key: PermissionKey;
};

export type Tour = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  price?: number | null;
  priceFrom?: number | null;
  duration: string | null;
  isPublished?: boolean;
  coverImageUrl: string | null;
  contentImageUrl: string | null;
  maxAltitude?: string | null;
  passengers?: string | null;
  bestSeason?: string | null;
  quickFacts?: QuickFacts | null;
  observances?: Observance[] | null;
  flightFeels?: FlightFeels | null;
  journey?: JourneyStep[] | null;
  peaksEncountered?: PeakEncountered[] | null;
  includedPermits?: IncludedPermit[] | null;
  dressGuideItems?: DressGuideItem[];
  faqs?: TourFaq[];
  gallery?: TourGalleryItem[];
  experience?: string | null;
  region?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuickFacts = {
  duration?: string;
  maxAltitude?: string;
  difficultyLevel?: string;
  privateCharterPrice?: string;
  hotelPickup?: string;
  tourFlightDuration?: string;
  minRecommendedAge?: string;
  idealTime?: string;
  travelInsurance?: string;
  helicopterType?: string;
  bestSeason?: string;
  mealsIncluded?: string;
  helicopterCapacity?: string;
  sharedTourPrice?: string;
  permitsIncluded?: string;
};

export type Observance = {
  topic: string;
  description: string;
};

export type FlightFeels = {
  topic: string;
  description: string;
  tourMap?: string;
};

export type JourneyStep = {
  stepNo: number;
  time: string;
  topic: string;
  summary: string;
};

export type PeakEncountered = {
  peakName: string;
  rankLabel: string;
  elevation: string;
  description: string;
  tag?: string;
};

export type DressGuideItem = {
  id?: string;
  layer: string;
  item: string;
  why: string;
  sortOrder?: number;
};

export type TourFaq = {
  id?: string;
  question: string;
  answer: string;
  sortOrder?: number;
};

export type TourGalleryItem = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder?: number;
};

export type IncludedPermit = {
  permitName: string;
  departmentOrMunicipality: string;
  usdAmount: string;
  nepaliAmount: string;
  importantNotice: string;
};

export type BlogPost = {
  id: string;
  slug: string | null;
  title: string;
  excerpt?: string | null;
  content: string;
  author?: string | null;
  category?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertPopup = {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SourceType =
  | "WEBSITE"
  | "ADS"
  | "SOCIAL"
  | "OTA"
  | "WHATSAPP"
  | "PHONE"
  | "REFERRAL"
  | "WALK_IN"
  | "MANUAL"
  | "OTHER";

export type Inquiry = {
  id: string;
  type?: "BOOKING" | "CHARTER" | "CONTACT";
  inquiryType?: "BOOKING" | "CHARTER" | "CONTACT";
  name: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string;
  sourceType: SourceType | null;
  sourceName: string | null;
  sourceMedium: string | null;
  campaignName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrerUrl: string | null;
  landingPage: string | null;
  sourceNote: string | null;
  tourId: string | null;
  booking?: Booking | null;
  createdAt: string;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type Booking = {
  id: string;
  inquiryId: string | null;
  tourId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingDate: string | null;
  amount: number | null;
  currency: string;
  status: BookingStatus;
  notes: string | null;
  sourceType: SourceType | null;
  sourceName: string | null;
  sourceMedium: string | null;
  campaignName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrerUrl: string | null;
  landingPage: string | null;
  sourceNote: string | null;
  createdAt: string;
  updatedAt: string;
  tour?: Tour | null;
  inquiry?: Inquiry | null;
};

export type SourceSummaryRow = {
  label: string;
  sourceType: SourceType | null;
  sourceName: string | null;
  count: number;
};

export type CampaignSummaryRow = {
  name: string;
  count: number;
};

export type DashboardSourceSummary = {
  bookingsBySource: SourceSummaryRow[];
  inquiriesBySource: SourceSummaryRow[];
  revenueBySource: SourceSummaryRow[];
  topCampaigns: CampaignSummaryRow[];
};

export type NavigationItem = {
  id: string;
  label: string;
  slug: string;
  url: string;
  location: string;
  order: number;
  isVisible: boolean;
  isExternal: boolean;
  createdAt: string;
  updatedAt: string;
};
