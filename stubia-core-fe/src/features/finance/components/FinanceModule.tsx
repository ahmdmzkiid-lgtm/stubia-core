import React, { useState } from 'react';
import { CashflowLedger } from './CashflowLedger';
import { PayrollGenerator } from './PayrollGenerator';
import { FinanceDashboard } from './FinanceDashboard';
import { Landmark, Wallet2, CalendarDays, BarChart3 } from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'payroll' | 'dashboard'>('cashflow');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-[#1B3FAB]" />
          <h2 className="text-xl font-bold text-[#0F172A]">Corporate Finance & Payroll</h2>
        </div>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Rekam arus kas penerimaan, kelola pembayaran payroll kontributor soal penulis, dan audit biaya token komputasi AI.
        </p>
      </div>

      {/* Toolbar tabs selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 self-start max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'cashflow'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Wallet2 className="h-4 w-4" />
          <span>Buku Kas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'payroll'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Payroll Gaji</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'dashboard'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Laporan Kas</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'cashflow' ? (
          <CashflowLedger />
        ) : activeTab === 'payroll' ? (
          <PayrollGenerator />
        ) : (
          <FinanceDashboard />
        )}
      </div>
    </div>
  );
};
export default FinanceModule;
