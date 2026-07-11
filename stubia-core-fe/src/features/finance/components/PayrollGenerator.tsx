import React, { useEffect, useState } from 'react';
import { PayrollRecord } from '../types/finance.types';
import { financeApi } from '../api/financeApi';
import { DataTable } from '../../../components/shared/DataTable';
import { Badge } from '../../../components/shared/Badge';
import { Button } from '../../../components/shared/Button';
import { RefreshCw, Coins, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

export const PayrollGenerator: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Period selections (current month & year defaults)
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const data = await financeApi.getPayrolls(month, year);
      setPayrolls(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const handleGenerate = async () => {
    setIsLoading(true);
    const toastId = toast.loading(`Membaca jumlah soal disetujui untuk periode ${month}/${year}...`);
    try {
      await financeApi.generatePayroll(month, year);
      toast.success('Payroll berhasil dikompilasi ulang!', { id: toastId });
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyusun payroll.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin memproses pembayaran payroll ini? Transaksi pengeluaran kas akan otomatis tercatat.')) {
      const toastId = toast.loading('Memproses pencairan gaji & transfer pembukuan kas...');
      try {
        await financeApi.payPayroll(id);
        toast.success('Payroll berhasil dibayarkan!', { id: toastId });
        fetchPayrolls();
      } catch (err: any) {
        toast.error(err.message || 'Gagal memproses pembayaran.', { id: toastId });
      }
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const columns = [
    {
      header: 'Nama Penulis',
      accessor: 'user.name',
      className: 'w-[20%]',
      render: (val: string, row: PayrollRecord) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#0F172A]">{val}</p>
          <p className="text-[10px] text-[#64748B] font-semibold">{row.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Gaji Pokok',
      accessor: 'baseSalary',
      className: 'w-[15%]',
      render: (val: number) => (
        <span className="text-xs font-bold text-slate-700">{formatIDR(val)}</span>
      ),
    },
    {
      header: 'Soal Approved',
      accessor: 'soalCount',
      className: 'w-[15%]',
      render: (val: number, row: PayrollRecord) => (
        <div className="space-y-0.5">
          <p className="text-xs font-extrabold text-[#1B3FAB]">{val} Soal</p>
          <p className="text-[9px] text-[#64748B] font-bold">Incentive: {formatIDR(row.soalIncentive)} / soal</p>
        </div>
      ),
    },
    {
      header: 'Total Gaji',
      accessor: 'totalAmount',
      className: 'w-[20%]',
      render: (val: number) => (
        <span className="text-xs font-extrabold text-emerald-600">{formatIDR(val)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'w-[15%]',
      render: (val: string) => (
        <Badge variant={val === 'PAID' ? 'Done' : 'Rejected'}>
          {val === 'PAID' ? 'PAID (Lunas)' : 'UNPAID'}
        </Badge>
      ),
    },
    {
      header: 'Aksi',
      className: 'w-[15%] text-center',
      render: (_: any, row: PayrollRecord) => (
        row.status === 'UNPAID' ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => handlePay(row.id)}
            className="text-[10px] font-bold h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 mx-auto"
          >
            <Coins className="h-3.5 w-3.5" /> Bayar Gaji
          </Button>
        ) : (
          <span className="text-[10px] font-bold text-[#10B981]">Lunas dibayar</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#1B3FAB]" />
          <h3 className="text-base font-bold text-[#0F172A]">Payroll Gaji Penulis (Content Creator)</h3>
        </div>

        {/* Filters and generation controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Month selector */}
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] font-semibold"
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx} value={idx + 1}>
                Bulan {new Date(0, idx).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] font-semibold"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <Button
            variant="ghost"
            onClick={handleGenerate}
            isLoading={isLoading}
            className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9] h-9"
          >
            <RefreshCw className="h-4 w-4 mr-1.5 text-[#1B3FAB]" /> Hitung Gaji
          </Button>
        </div>
      </div>

      {/* Datatable */}
      <DataTable
        columns={columns}
        data={payrolls}
        isLoading={isLoading}
        emptyMessage="Tidak ada catatan payroll yang dihasilkan untuk periode ini. Silakan klik Hitung Gaji untuk menyusun daftar."
      />
    </div>
  );
};
export default PayrollGenerator;
