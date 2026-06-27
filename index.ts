export type ItemType = 'Policy' | 'FD' | 'RD' | 'Mutual Fund';

export interface FinancialItem {
  id: string;
  user_id: string;
  type: ItemType;
  name: string;
  institution: string | null;
  principal_amount: number | null;
  current_value: number | null;
  maturity_value: number | null;
  maturity_date: string | null; // ISO date
  next_payment_date: string | null; // ISO date
  payment_amount: number | null;
  frequency: string | null;
  notes: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialItemInput = Omit<
  FinancialItem,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export const ITEM_TYPES: ItemType[] = ['Policy', 'FD', 'RD', 'Mutual Fund'];

export const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-time'];

export const TYPE_STYLES: Record<ItemType, { color: string; bg: string }> = {
  Policy: { color: '#7c6f5f', bg: '#f4f1ec' },
  FD: { color: '#6b8a7a', bg: '#eef3f0' },
  RD: { color: '#8a7560', bg: '#f5efe8' },
  'Mutual Fund': { color: '#7a6f9c', bg: '#f0eef5' },
};
