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
  is_valid?: boolean;
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

export type BusinessTripStatus = "draft" | "ongoing" | "ready_to_verify" | "completed" | "canceled";

export interface KwitansiData {
  businessTripNumber?: string;
  assignmentLetterNumber?: string;
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

// GRC Related Types

export interface GRCStatistics {
  total_units: number;
  average_score: number;
  median: number;
  std_deviation: number;
}

export interface GRCPerformanceDistribution {
  level: string;
  count: number;
  min_score: number;
  max_score: number;
}

export interface GRCWeakestComponent {
  code: string;
  name: string;
  average: number;
  units_below_80: number;
}

export interface GRCOverviewData {
  statistics: GRCStatistics;
  performance_distribution: GRCPerformanceDistribution[];
  weakest_components: GRCWeakestComponent[];
  average_score_history: { period: string; score: number }[];
}

export interface GRCOverviewResponse {
  success: boolean;
  data: GRCOverviewData;
}

export interface GRCUnit {
  id: number;
  name: string;
  category: string;
  average: number;
  rank: number;
  percentile: number;
  scores?: Record<string, number>;
}

export interface GRCUnitsResponse {
  success: boolean;
  data: {
    units: GRCUnit[];
    total_count: number;
  };
}

export interface GRCRadarData {
  labels: string[];
  values: number[];
  average_values: number[];
}

export interface GRCComponentStrength {
  component: string;
  value: number;
  gap_from_average: number;
}

export interface GRCGapAnalysis {
  component: string;
  value: number;
  average: number;
  gap: number;
}

export interface GRCCategoryComparison {
  category_name: string;
  gap_to_category: number;
}

export interface GRCUnitDetailData {
  unit: GRCUnit;
  radar_data: GRCRadarData;
  strength: GRCComponentStrength;
  weakness: GRCComponentStrength;
  gap_analysis: GRCGapAnalysis[];
  category_comparison: GRCCategoryComparison;
}

export interface GRCUnitDetailResponse {
  success: boolean;
  data: GRCUnitDetailData;
}

export interface GRCCategoryBreakdown {
  name: string;
  count: number;
  average: number;
  min: number;
  max: number;
  top_unit: {
    name: string;
    average: number;
  };
  bottom_unit: {
    name: string;
    average: number;
  };
}

export interface GRCCategoriesResponse {
  success: boolean;
  data: {
    categories: GRCCategoryBreakdown[];
  };
}

// Chatbot RAG Related Types

export type DocumentStatus = 'processing' | 'active' | 'failed';

export interface KnowledgeBase {
  id: string;
  user_id?: string;
  name: string;
  file_search_store_id: string;
  is_global: boolean;
  total_files: number;
  total_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseDocument {
  id: string;
  knowledge_base_id: string;
  document_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  knowledge_base_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  document_name: string;
  content: string;
  start_index?: number;
  end_index?: number;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

// Chatbot API Response Types

export interface KnowledgeBaseResponse {
  data: KnowledgeBase;
}

export interface KnowledgeBasesResponse {
  data: KnowledgeBase[];
}

export interface KnowledgeBaseDetailResponse {
  data: {
    knowledge_base: KnowledgeBase;
    documents: KnowledgeBaseDocument[];
  };
}

export interface UploadFilesResponse {
  data: {
    documents: KnowledgeBaseDocument[];
    errors: string[];
  };
}

export interface ChatSessionResponse {
  data: ChatSession;
}

export interface ChatSessionsResponse {
  data: ChatSession[];
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
}

export interface SendMessageResponse {
  data: {
    user_message: ChatMessage;
    assistant_message: ChatMessage;
  };
}
