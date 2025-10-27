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
  employee_id: string;
  position: string;
  rank: string;
  transactions: Transaction[];
}

export interface KwitansiData {
  startDate: string;
  endDate: string;
  activityPurpose: string;
  destinationCity: string;
  spdDate: string;
  departureDate: string;
  returnDate: string;
  receiptSignatureDate: string;
  assignees: Assignee[];
  exportTime?: string; // Timestamp when data is exported
}
