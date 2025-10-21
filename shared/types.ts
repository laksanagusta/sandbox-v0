export interface EditableRow {
  id: string;
  description: string;
  amount: number;
  name: string;
  type: string;
  subtype: string;
  total_night: string;
  subtotal: number;
  transport_detail?: string;
  payment_type: PaymentType;
  spd_number?: string;
}

export type PaymentType = "uang muka" | "rampung";

export interface TransactionDTO {
  name: string;
  type: string;
  subtype: string;
  amount: number;
  total_night?: number;
  subtotal: number;
  payment_type: PaymentType;
  spd_number?: string;
}
