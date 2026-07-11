import React, { useEffect, useState } from 'react';
import { CashflowEntry } from '../types/finance.types';
import { financeApi } from '../api/financeApi';
import { DataTable } from '../../../components/shared/DataTable';
import { Badge } from '../../../components/shared/Badge';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import { Textarea } from '../../../components/shared/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Plus, Wallet2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const transactionSchema = zod.object({
  type: zod.enum(['debit', 'kredit']),
  category: zod.enum(['Operasional', 'Marketing', 'Payroll', 'Revenue', 'AI_COST']),
  amount: zod.number().min(1, 'Jumlah nominal wajib diisi'),
  description: zod.string().min(5, 'Keterangan minimal berisi 5 karakter'),
});

type TransactionFormFields = zod.infer<typeof transactionSchema>;

export const CashflowLedger: React.FC = () => {
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormFields>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'kredit',
      category: 'Operasional',
    },
  });

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const data = await financeApi.getCashflowEntries();
      setEntries(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat buku kas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const onSubmit = async (data: TransactionFormFields) => {
    try {
      await financeApi.createCashflowEntry(data);
      toast.success('Transaksi keuangan berhasil dicatat!');
      setIsModalOpen(false);
      reset();
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  const columns = [
    {
      header: 'Tanggal',
      accessor: 'entryDate',
      className: 'w-[15%]',
      render: (val: string) => (
        <span className="text-xs font-bold text-[#64748B]">
          {new Date(val).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Keterangan',
      accessor: 'description',
      className: 'w-[35%]',
      render: (val: string) => (
        <span className="text-xs font-semibold text-[#0F172A]">{val}</span>
      ),
    },
    {
      header: 'Kategori',
      accessor: 'category',
      className: 'w-[15%]',
      render: (val: string) => {
        let badgeStyle: any = 'Default';
        if (val === 'Revenue') badgeStyle = 'Done';
        if (val === 'Payroll') badgeStyle = 'InProgress';
        if (val === 'AI_COST') badgeStyle = 'AI-Gen';
        if (val === 'Marketing') badgeStyle = 'Warning';
        return <Badge variant={badgeStyle}>{val}</Badge>;
      },
    },
    {
      header: 'Tipe',
      accessor: 'type',
      className: 'w-[10%]',
      render: (val: string) => (
        <span className={`text-xs font-bold inline-flex items-center gap-0.5 ${
          val === 'debit' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {val === 'debit' ? (
            <>
              <ArrowDownRight className="h-3.5 w-3.5" /> Inflow
            </>
          ) : (
            <>
              <ArrowUpRight className="h-3.5 w-3.5" /> Outflow
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Nominal',
      accessor: 'amount',
      className: 'w-[15%] text-right',
      render: (val: number, row: CashflowEntry) => (
        <span className={`text-xs font-extrabold ${
          row.type === 'debit' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {row.type === 'debit' ? '+' : '-'} {formatIDR(val)}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      accessor: 'recordedBy',
      className: 'w-[10%]',
      render: (_: any, row: CashflowEntry) => (
        <span className="text-[10px] font-bold text-[#64748B]">{row.recordedBy?.name || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wallet2 className="h-5 w-5 text-[#1B3FAB]" />
          <h3 className="text-base font-bold text-[#0F172A]">Buku Kas Transaksi (Cashflow)</h3>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold"
        >
          <Plus className="h-4.5 w-4.5 mr-1.5" /> Catat Transaksi Manual
        </Button>
      </div>

      {/* Datatable */}
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        emptyMessage="Belum ada catatan pembukuan transaksi keuangan."
      />

      {/* Modal recording */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catat Transaksi Buku Kas">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Cashflow Type */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-3">
              {['debit', 'kredit'].map((typeOption) => (
                <label
                  key={typeOption}
                  className={`border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    watch('type') === typeOption
                      ? typeOption === 'debit'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-red-50 border-red-300 text-red-800'
                      : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <input
                    type="radio"
                    value={typeOption}
                    className="sr-only"
                    {...register('type')}
                  />
                  <span className="text-xs font-bold uppercase">{typeOption === 'debit' ? 'Inflow (Debit)' : 'Outflow (Kredit)'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Kategori</label>
            <select
              className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
              {...register('category')}
            >
              <option value="Operasional">Operasional Kantor</option>
              <option value="Marketing">Pemasaran / Marketing</option>
              <option value="Payroll">Gaji Penulis (Payroll)</option>
              <option value="Revenue">Pendapatan Ujian (Revenue)</option>
              <option value="AI_COST">Konsumsi Token AI (AI Cost)</option>
            </select>
          </div>

          {/* Amount */}
          <Input
            label="Nominal Transaksi (Rupiah)"
            type="number"
            placeholder="e.g. 500000"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          {/* Description */}
          <Textarea
            label="Keterangan Rincian Pembayaran"
            placeholder="e.g. Pembelian token listrik kantor, Langganan server tryout..."
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Submit */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#CBD5E1]/40 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white shadow-md"
            >
              Bukukan Transaksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default CashflowLedger;
