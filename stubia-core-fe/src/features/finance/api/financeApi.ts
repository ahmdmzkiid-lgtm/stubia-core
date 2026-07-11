import { useAuthStore } from '../../../store/authStore';
import { CashflowEntry, PayrollRecord, FinanceAnalytics } from '../types/finance.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const financeApi = {
  // Cashflow CRUD
  getCashflowEntries: async (filters?: { category?: string; type?: string }): Promise<CashflowEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);

    const res = await fetch(`/api/finance/cashflow?${params.toString()}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch cashflow entries');
    return result.data;
  },

  createCashflowEntry: async (entryData: { type: string; amount: number; category: string; description: string }): Promise<CashflowEntry> => {
    const res = await fetch('/api/finance/cashflow', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(entryData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create cashflow entry');
    return result.data;
  },

  // Payroll
  getPayrolls: async (month?: number, year?: number): Promise<PayrollRecord[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));

    const res = await fetch(`/api/finance/payroll?${params.toString()}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch payroll records');
    return result.data;
  },

  generatePayroll: async (month: number, year: number): Promise<PayrollRecord[]> => {
    const res = await fetch('/api/finance/payroll/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ month, year }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to generate payroll');
    return result.data;
  },

  payPayroll: async (id: string): Promise<PayrollRecord> => {
    const res = await fetch(`/api/finance/payroll/${id}/pay`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to pay payroll');
    return result.data;
  },

  // Analytics
  getFinanceAnalytics: async (): Promise<FinanceAnalytics> => {
    const res = await fetch('/api/finance/analytics', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch finance analytics');
    return result.data;
  },
};
