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
}

export interface TransactionDTO {
  name: string;
  type: string;
  subtype: string;
  amount: number;
  total_night?: number;
  subtotal: number;
}
