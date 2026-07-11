export type CashflowType = 'debit' | 'kredit';

export interface CashflowEntry {
  id: string;
  type: CashflowType;
  amount: number;
  category: string;
  description: string;
  entryDate: string;
  recordedById: string;
  recordedBy?: { id: string; name: string; email: string };
}

export interface PayrollRecord {
  id: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: number;
  soalCount: number;
  soalIncentive: number;
  totalAmount: number;
  status: 'UNPAID' | 'PAID';
  generatedAt: string;
  userId: string;
  user?: { id: string; name: string; email: string; role: string };
}

export interface FinanceAnalytics {
  totalInflow: number;
  totalOutflow: number;
  netIncome: number;
  categoryBreakdown: Array<{ name: string; value: number }>;
  costLedgerOverTime: Array<{ date: string; amount: number }>;
}
