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
  | "VIEW_USERS"
  | "VIEW_NEWSLETTERS";

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
  experience?: string | null;
  region?: string | null;
  createdAt: string;
  updatedAt: string;
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

export type NewsletterAudienceType = "ALL_SUBSCRIBERS" | "PREMIUM_USERS" | "CUSTOM";
export type NewsletterStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

export type Newsletter = {
  id: string;
  title: string;
  subject: string;
  previewText: string | null;
  contentHtml: string;
  contentText: string | null;
  audienceType: NewsletterAudienceType;
  status: NewsletterStatus;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    recipients: number;
  };
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string | null;
  isSubscribed: boolean;
  unsubscribedAt: string | null;
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
export type PaymentStatus = "PENDING" | "UNPAID" | "PAID_IN_FULL";
export type CustomerCategory = "NO_BOOKING" | "NEW" | "REPEATED" | "VIP";

export type Booking = {
  id: string;
  inquiryId: string | null;
  tourId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingDate: string | null;
  passengerCount: number | null;
  amount: number | null;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
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

export type CustomerRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  category: CustomerCategory;
  bookingCount: number;
  totalSpent: number;
  latestBookingAt: string | null;
  latestTourTitle: string | null;
  joinedAt: string | null;
  authProviders: string[];
  statuses: Partial<Record<BookingStatus, number>>;
};

export type CustomerSummary = {
  totalCustomers: number;
  visibleCustomers: number;
  noBookingCustomers: number;
  newCustomers: number;
  repeatedCustomers: number;
  vipCustomers: number;
  repeatRate: number;
  totalValue: number;
};

export type CalendarBooking = {
  id: string;
  bookingDate: string | null;
  tourId: string | null;
  tourSlug: string | null;
  tourTitle: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  passengerCount: number | null;
  status: BookingStatus;
  amount: number | null;
  currency: string;
  sourceType: SourceType | null;
  sourceName: string | null;
  notes: string | null;
};

export type CalendarSummary = {
  totalBookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  totalPassengers: number;
  totalAmount: number;
};

export type CalendarTourOption = {
  id: string;
  slug: string;
  title: string;
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

export type DashboardRecentInquiry = Pick<
  Inquiry,
  "id" | "inquiryType" | "name" | "email" | "phone" | "createdAt"
>;

export type DashboardOverview = {
  counts: {
    tours: number | null;
    blogs: number | null;
    bookings: number | null;
    inquiries: number | null;
    customers: number | null;
    users: number | null;
  };
  recentInquiries: DashboardRecentInquiry[];
  sourceSummary: DashboardSourceSummary;
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
