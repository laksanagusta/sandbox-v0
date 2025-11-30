export type PaymentType = "uang muka" | "rampung";

export interface Transaction {
  name?: string; // Optional for transactions within an assignee
  type: string;
  subtype: string;
  amount: number;
  subtotal: number;
  payment_type: PaymentType;
  description?: string;
  transport_detail?: string;
  spd_number?: string;
  total_night?: number; // Number of nights for hotel transactions
}

export interface Assignee {
  name: string;
  spd_number: string;
  employee_number: string;
  position: string;
  rank: string;
  employee_id: string;
  transactions: Transaction[];
}

export type BusinessTripStatus = "draft" | "ongoing" | "completed" | "canceled";

export interface KwitansiData {
  businessTripNumber?: string;
  startDate: string;
  endDate: string;
  activityPurpose: string;
  destinationCity: string;
  spdDate: string;
  departureDate: string;
  returnDate: string;
  receiptSignatureDate: string;
  status: BusinessTripStatus;
  documentLink?: string;
  assignees: Assignee[];
  exportTime?: string; // Timestamp when data is exported
}

// Vaccine related types
export interface Vaccine {
  vaccine_code: string;
  vaccine_name: string;
  description: string;
  vaccine_type: "routine" | "travel" | "optional";
  recommendation: "required" | "recommended" | "consider";
}

export interface VaccineRecommendation {
  country_code: string;
  country_name: string;
  required_vaccines: Vaccine[] | null;
  recommended_vaccines: Vaccine[] | null;
  consider_vaccines: Vaccine[] | null;
  malaria_risk: string;
  malaria_prophylaxis: string;
  health_notice: string;
  last_updated: string;
  data_source: string;
}

export interface Country {
  id: string;
  country_code: string;
  country_name_id: string;
  country_name_en: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountriesResponse {
  data: Country[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface VaccineRecommendationResponse {
  data: VaccineRecommendation;
  message: string;
  success: boolean;
}
