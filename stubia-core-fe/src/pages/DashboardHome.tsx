import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  BookOpen,
  KanbanSquare,
  FolderOpen,
  Calendar,
  Wallet2,
  Users,
  Coins,
  BarChart3,
  ClipboardList,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { tasksApi } from '../features/tasks/api/tasksApi';
import { Task } from '../features/tasks/types/tasks.types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DashboardStats {
  totals: {
    questions: number;
    tasks: number;
    events: number;
    users: number;
  };
  userStats: {
    questionsCreated: number;
    questionsApproved: number;
    questionsDraft: number;
    tasksAssigned: number;
    myTasksStats?: {
      total: number;
      todo: number;
      review: number;
      done: number;
    };
  };
  difficultyDistribution: {
    EASY: number;
    MEDIUM: number;
    HOTS: number;
  };
  taskDistribution: {
    BACKLOG: number;
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  subtestDistribution?: Array<{
    name: string;
    count: number;
  }>;
  myUpcomingTasks?: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    type: string;
    deadline?: string | null;
    proofUrl?: string | null;
    proofName?: string | null;
    assignee: string;
  }>;
  myRecentSubmissions?: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    type: string;
    deadline?: string | null;
    proofUrl?: string | null;
    proofName?: string | null;
    assignee: string;
  }>;
  pendingReviewTasks?: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    type: string;
    deadline?: string | null;
    proofUrl?: string | null;
    proofName?: string | null;
    assignee: string;
  }>;
  finance: {
    debit: number;
    kredit: number;
    balance: number;
    categoryBreakdown?: Array<{
      category: string;
      amount: number;
    }>;
    recentTransactions?: Array<{
      id: string;
      description: string;
      amount: number;
      type: string;
      category: string;
      entryDate: string;
      recordedBy: string;
    }>;
  };
  hrOps?: {
    teamWorkload: Array<{
      id: string;
      name: string;
      role: string;
      totalTasks: number;
      activeTasks: number;
      doneTasks: number;
    }>;
    upcomingEvents: Array<{
      id: string;
      title: string;
      type: string;
      startDate: string;
      endDate: string;
      status: string;
      pic: string;
    }>;
  };
  aiUsage: {
    cost: number;
    tokens: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  academic_manager: 'Academic Manager',
  content_creator: 'Content Creator',
  hr_ops: 'HR & Operations',
  finance_officer: 'Finance Officer',
};

export const DashboardHome: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scope toggle for super_admin & academic_manager: 'team' | 'personal'
  const isManagement = user?.role === 'super_admin' || user?.role === 'academic_manager';
  const [activeScope, setActiveScope] = useState<'team' | 'personal'>(
    user?.role === 'content_creator' ? 'personal' : 'team'
  );

  const COLORS = ['#64748B', '#F59E0B', '#10B981']; // Slate (Todo), Amber (Review), Emerald (Done)

  const fetchDashboardData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    try {
      const [res, tasksData] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        tasksApi.getTasks(),
      ]);

      const result = await res.json();
      if (res.ok && result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || 'Gagal memuat statistik');
      }
      setTasks(tasksData);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyinkronkan data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    // Realtime polling: refresh dashboard stats every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: 'AI Question Generator',
      desc: 'Buat soal UTBK otomatis berbasis AI dengan template prompt.',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100/50',
      link: '/ai-generator',
      roles: ['super_admin', 'academic_manager', 'content_creator'],
      badge: 'Baru',
    },
    {
      title: 'Bank Soal',
      desc: 'Kelola database soal UTBK-SNBT dengan validasi anti-duplikasi otomatis.',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50',
      link: '/questions',
      roles: ['super_admin', 'academic_manager', 'content_creator'],
    },
    {
      title: 'Kanban Tasks',
      desc: 'Pantau tugas harian pembuatan soal, review konten, dan pemasaran.',
      icon: KanbanSquare,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50',
      link: '/tasks',
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      title: 'Finance & Payroll',
      desc: 'Lihat cashflow ledger, reimbursement, dan rekap penggajian bulanan.',
      icon: Wallet2,
      color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50',
      link: '/finance',
      roles: ['super_admin', 'finance_officer'],
    },
    {
      title: 'Blueprint & Docs',
      desc: 'Akses folder dokumen legal, OKR perusahaan, SOP, dan audit trail.',
      icon: FolderOpen,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/50',
      link: '/blueprint',
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      title: 'Event Timeline',
      desc: 'Kalender Tryout terintegrasi dengan penjadwalan tugas otomatis.',
      icon: Calendar,
      color: 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/50',
      link: '/events',
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
  ];

  const allowedFeatures = features.filter((f) => user && f.roles.includes(user.role));

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]" />
        <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Menghitung performa real-time...</p>
      </div>
    );
  }

  // Format currency helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 11
      ? 'Selamat pagi'
      : currentHour < 15
      ? 'Selamat siang'
      : currentHour < 18
      ? 'Selamat sore'
      : 'Selamat malam';
  const firstName = user?.name?.split(' ')[0] || user?.name || 'Rekan';

  // Compute chart data based on active scope
  const myStats = stats?.userStats.myTasksStats || { total: 0, todo: 0, review: 0, done: 0 };
  const teamDone = tasks.filter((t) => t.status === 'DONE').length;
  const teamReview = tasks.filter((t) => t.status === 'REVIEW').length;
  const teamTodo = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'BACKLOG').length;

  const isPersonalMode = activeScope === 'personal' || user?.role === 'content_creator';

  const chartData = isPersonalMode
    ? [
        { name: 'Tugas Belum Selesai', value: myStats.todo },
        { name: 'Menunggu Review', value: myStats.review },
        { name: 'Selesai & Disetujui', value: myStats.done },
      ]
    : [
        { name: 'Belum Selesai', value: teamTodo },
        { name: 'Menunggu Review', value: teamReview },
        { name: 'Selesai & Disetujui', value: teamDone },
      ];

  return (
    <div className="space-y-6">
      {/* ── Executive / Employee Dashboard Header ── */}
      <div className="bg-gradient-to-r from-white via-slate-50/50 to-blue-50/25 border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-[#1B3FAB]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                {timeGreeting}, {firstName}!
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1B3FAB] px-2.5 py-0.5 rounded-full border border-blue-200">
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </span>
            </div>

            <p className="text-xs text-[#64748B] font-medium leading-relaxed max-w-2xl">
              {user?.role === 'content_creator'
                ? 'Kelola daftar tugas pembuatan soal, tenggat penugasan, dan pantau status review Anda.'
                : user?.role === 'academic_manager'
                ? 'Pantau kualitas bank soal, sebaran materi UTBK/TKA, dan antrean peninjauan konten tim.'
                : user?.role === 'finance_officer'
                ? 'Ikhtisar buku kas, arus kas masuk/keluar, penggajian karyawan, dan pencatatan operasional.'
                : user?.role === 'hr_ops'
                ? 'Pantau distribusi beban kerja tim, keaktifan kolaborator, dan jadwal agenda operasional.'
                : 'Pusat komando eksekutif operasional akademik, arus kas keuangan, dan progres tim Stubia.'}
            </p>

            {/* Micro Status Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistem Operasional</span>
              </div>

              {/* Personal vs Team Indicators */}
              {user?.role === 'content_creator' ? (
                <>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <KanbanSquare className="h-3.5 w-3.5 text-[#1B3FAB]" />
                    <span>{myStats.total} Tugas Saya ({myStats.todo} Aktif)</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                    <span>{stats?.userStats.questionsCreated || 0} Soal Dibuat Saya</span>
                  </div>
                </>
              ) : user?.role === 'finance_officer' ? (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <Wallet2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Kas Bersih: {formatRupiah(stats?.finance.balance || 0)}</span>
                </div>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <BookOpen className="h-3.5 w-3.5 text-[#1B3FAB]" />
                    <span>{stats?.totals.questions || 0} Soal di Bank</span>
                  </div>
                  {(stats?.pendingReviewTasks?.length || 0) > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{stats?.pendingReviewTasks?.length} Tugas Menunggu Review</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Controls: Scope Toggle (for managers/admin) + Live Date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
            {isManagement && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveScope('team')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeScope === 'team'
                      ? 'bg-white text-[#1B3FAB] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Tim Organisasi</span>
                </button>
                <button
                  onClick={() => setActiveScope('personal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeScope === 'personal'
                      ? 'bg-white text-[#1B3FAB] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Tugas Saya</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-[#1B3FAB] shrink-0" />
              <span>
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {(user?.role === 'super_admin' || user?.role === 'academic_manager' || user?.role === 'content_creator') && (
              <Link
                to="/ai-generator"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B3FAB] hover:bg-[#15328B] text-white text-xs font-bold active:scale-[0.98] transition-all shadow-sm group"
              >
                <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                <span>Generate Soal</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Dynamic KPI Metrics (Tailored to Role & Scope) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isPersonalMode ? (
          // ── PERSONAL WORKSPACE KPIS (For Content Creator & Personal Scope) ──
          <>
            {/* Card 1: Tugas Saya Ditugaskan */}
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <KanbanSquare className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Tugas Ditugaskan ke Saya</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {myStats.total} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span className="text-amber-600">{myStats.todo} belum selesai</span>
                <span>• {myStats.review} direview</span>
              </div>
            </div>

            {/* Card 2: Tugas Selesai Saya */}
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Tugas Selesai & Disetujui</p>
              <p className="text-3xl font-black text-[#10B981] mt-2.5">
                {myStats.done} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Tingkat penyelesaian: {myStats.total > 0 ? Math.round((myStats.done / myStats.total) * 100) : 100}%</span>
              </div>
            </div>

            {/* Card 3: Soal Dibuat Saya */}
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Soal yang Saya Buat</p>
              <p className="text-3xl font-black text-[#7C3AED] mt-2.5">
                {stats?.userStats.questionsCreated || 0} <span className="text-xs font-bold text-slate-400">soal</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span className="text-emerald-600">{stats?.userStats.questionsApproved || 0} terverifikasi</span>
                <span>• {stats?.userStats.questionsDraft || 0} draft</span>
              </div>
            </div>

            {/* Card 4: Menunggu Review Manager */}
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Menunggu Review Manager</p>
              <p className="text-3xl font-black text-[#D97706] mt-2.5">
                {myStats.review} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Tugas yang telah Anda ajukan bukti</span>
              </div>
            </div>
          </>
        ) : user?.role === 'finance_officer' ? (
          // ── FINANCE OFFICER KPIS ──
          <>
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Wallet2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Saldo Kas Bersih</p>
              <p className="text-xl font-black text-[#0F172A] mt-3.5 truncate" title={formatRupiah(stats?.finance.balance || 0)}>
                {formatRupiah(stats?.finance.balance || 0)}
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Status likuiditas kas operasional</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <ArrowDownRight className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Kas Masuk (Debit)</p>
              <p className="text-xl font-black text-emerald-600 mt-3.5 truncate" title={formatRupiah(stats?.finance.debit || 0)}>
                {formatRupiah(stats?.finance.debit || 0)}
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Total penerimaan kas tercatat</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Kas Keluar (Kredit)</p>
              <p className="text-xl font-black text-rose-600 mt-3.5 truncate" title={formatRupiah(stats?.finance.kredit || 0)}>
                {formatRupiah(stats?.finance.kredit || 0)}
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Pengeluaran operasional & payroll</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <ClipboardList className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Transaksi Kas Tercatat</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {stats?.finance.recentTransactions?.length || 0} <span className="text-xs font-bold text-slate-400">transaksi</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <Link to="/finance" className="text-[#1B3FAB] hover:underline">Lihat buku kas lengkap →</Link>
              </div>
            </div>
          </>
        ) : user?.role === 'hr_ops' ? (
          // ── HR & OPS KPIS ──
          <>
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Karyawan Aktif</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {stats?.totals.users || 0} <span className="text-xs font-bold text-slate-400">orang</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Semua departemen operasional</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <KanbanSquare className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Tugas Sedang Berjalan</p>
              <p className="text-3xl font-black text-[#D97706] mt-2.5">
                {(stats?.taskDistribution.TODO || 0) + (stats?.taskDistribution.IN_PROGRESS || 0)} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Dikerjakan oleh PIC tim</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Tugas Diselesaikan</p>
              <p className="text-3xl font-black text-[#10B981] mt-2.5">
                {stats?.taskDistribution.DONE || 0} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Tingkat keberhasilan tim Stubia</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Event & Agenda Tryout</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {stats?.totals.events || 0} <span className="text-xs font-bold text-slate-400">agenda</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span>Linimasa terjadwal</span>
              </div>
            </div>
          </>
        ) : (
          // ── EXECUTIVE OVERVIEW KPIS (Super Admin & Academic Manager Team Scope) ──
          <>
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Bank Soal</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {stats?.totals.questions || 0} <span className="text-xs font-bold text-slate-400">soal</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span className="text-[#10B981]">{stats?.difficultyDistribution.HOTS || 0} HOTS</span>
                <span>• {stats?.difficultyDistribution.MEDIUM || 0} Sedang</span>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <KanbanSquare className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Tugas Tim</p>
              <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                {stats?.totals.tasks || 0} <span className="text-xs font-bold text-slate-400">tugas</span>
              </p>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                <span className="text-[#F59E0B]">{teamReview} perlu review</span>
                <span>• {teamDone} selesai</span>
              </div>
            </div>

            {user?.role === 'super_admin' ? (
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Wallet2 className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Saldo Kas Perusahaan</p>
                <p className="text-xl font-black text-[#0F172A] mt-3.5 truncate" title={formatRupiah(stats?.finance.balance || 0)}>
                  {formatRupiah(stats?.finance.balance || 0)}
                </p>
                <div className="flex items-center gap-1.5 mt-3.5 text-[9px] font-extrabold uppercase text-[#64748B]">
                  <span className="text-emerald-600">IN: {formatRupiah(stats?.finance.debit || 0)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Antrean Review Tugas</p>
                <p className="text-3xl font-black text-[#D97706] mt-2.5">
                  {stats?.pendingReviewTasks?.length || 0} <span className="text-xs font-bold text-slate-400">tugas</span>
                </p>
                <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                  <span>Pengajuan butuh persetujuan</span>
                </div>
              </div>
            )}

            {user?.role === 'super_admin' ? (
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Coins className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Biaya AI</p>
                <p className="text-3xl font-black text-[#7C3AED] mt-2.5">
                  ${stats?.aiUsage.cost.toFixed(2) || '0.00'}
                </p>
                <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                  <span>Dari {stats?.aiUsage.tokens.toLocaleString() || 0} token digenerasi</span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Event Tryout Akademik</p>
                <p className="text-3xl font-black text-[#0F172A] mt-2.5">
                  {stats?.totals.events || 0} <span className="text-xs font-bold text-slate-400">event</span>
                </p>
                <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
                  <span>Jadwal tryout siswa aktif</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Role Tailored Main Sections Grid ── */}
      {isPersonalMode ? (
        // ── PERSONAL VIEW (Content Creator / Personal Scope) ──
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column: My Upcoming Tasks & Deadlines (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#1B3FAB]" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Tugas Saya Mendekati Tenggat
                </h4>
              </div>
              <Link to="/tasks" className="text-[11px] font-bold text-[#1B3FAB] hover:underline flex items-center gap-1">
                Buka Kanban Saya →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-3 custom-scrollbar">
              {!stats?.myUpcomingTasks || stats.myUpcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-[#0F172A]">Semua tugas Anda telah selesai!</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Tidak ada tugas aktif yang mendekati tenggat saat ini.</p>
                </div>
              ) : (
                stats.myUpcomingTasks.map((t) => {
                  const isOverdue = t.deadline && new Date(t.deadline).getTime() < Date.now();
                  return (
                    <div
                      key={t.id}
                      className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-[#1B3FAB]/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              t.priority === 'P1'
                                ? 'bg-rose-100 text-rose-700'
                                : t.priority === 'P2'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                          <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#64748B]">
                          <span>Tipe: {t.type.toUpperCase()}</span>
                          {t.deadline && (
                            <>
                              <span>•</span>
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                Tenggat: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                {isOverdue ? ' (Terlambat)' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-[#1B3FAB] border border-blue-200">
                          {t.status}
                        </span>
                        <Link
                          to="/tasks"
                          className="text-[11px] font-bold text-[#1B3FAB] bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs"
                        >
                          Kerjakan
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Personal Submissions & Proof Status (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Status Pengajuan Bukti Saya
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-3 custom-scrollbar">
              {!stats?.myRecentSubmissions || stats.myRecentSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Belum ada tugas yang diajukan bukti pengerjaan.</p>
                </div>
              ) : (
                stats.myRecentSubmissions.map((t) => (
                  <div
                    key={t.id}
                    className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                      <span
                        className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                          t.status === 'DONE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {t.status === 'DONE' ? 'DISETUJUI' : 'MENUNGGU REVIEW'}
                      </span>
                    </div>

                    {t.proofUrl && (
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                        <span className="text-[#64748B] truncate max-w-[160px]">{t.proofName || 'File Bukti'}</span>
                        <a
                          href={t.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#1B3FAB] hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          Lihat Bukti <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : user?.role === 'finance_officer' ? (
        // ── FINANCE OFFICER VIEW ──
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column: Recent Cashflow Entries (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet2 className="h-4.5 w-4.5 text-[#1B3FAB]" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Transaksi Kas Masuk & Keluar Terbaru
                </h4>
              </div>
              <Link to="/finance" className="text-[11px] font-bold text-[#1B3FAB] hover:underline flex items-center gap-1">
                Buka Ledger Keuangan →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-2.5 custom-scrollbar">
              {!stats?.finance.recentTransactions || stats.finance.recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Belum ada transaksi kas tercatat.</p>
                </div>
              ) : (
                stats.finance.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                        <span className="font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span>{new Date(tx.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span>Oleh: {tx.recordedBy}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-extrabold ${
                          tx.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'debit' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </p>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {tx.type === 'debit' ? 'Kas Masuk' : 'Kas Keluar'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Category Breakdown (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-amber-600" />
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Rincian Arus Kas per Kategori
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-3 custom-scrollbar">
              {!stats?.finance.categoryBreakdown || stats.finance.categoryBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Belum ada rincian kategori.</p>
                </div>
              ) : (
                stats.finance.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-[#0F172A]">{cat.category}</span>
                    <span className="text-xs font-black text-[#1B3FAB]">{formatRupiah(cat.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : user?.role === 'hr_ops' ? (
        // ── HR & OPERATIONS VIEW ──
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column: Team Workload (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#1B3FAB]" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Distribusi Beban Kerja Tim & PIC
                </h4>
              </div>
              <Link to="/tasks" className="text-[11px] font-bold text-[#1B3FAB] hover:underline">
                Lihat Semua Tugas →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-2.5 custom-scrollbar">
              {!stats?.hrOps?.teamWorkload || stats.hrOps.teamWorkload.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Tidak ada data karyawan.</p>
                </div>
              ) : (
                stats.hrOps.teamWorkload.map((m) => (
                  <div
                    key={m.id}
                    className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{m.name}</p>
                      <span className="text-[9px] font-extrabold uppercase text-[#1B3FAB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs font-black text-[#D97706]">{m.activeTasks} Aktif</p>
                        <span className="text-[9px] text-[#64748B] font-semibold">{m.doneTasks} Selesai</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-[#0F172A]">
                        {m.totalTasks}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Events (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-sky-600" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Agenda & Tryout Terdekat
                </h4>
              </div>
              <Link to="/events" className="text-[11px] font-bold text-[#1B3FAB] hover:underline">
                Kalender →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-2.5 custom-scrollbar">
              {!stats?.hrOps?.upcomingEvents || stats.hrOps.upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Tidak ada agenda dalam waktu dekat.</p>
                </div>
              ) : (
                stats.hrOps.upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3 space-y-1"
                  >
                    <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{ev.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>
                        {new Date(ev.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-semibold text-[#1B3FAB]">PIC: {ev.pic}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // ── EXECUTIVE / ACADEMIC OVERVIEW (Super Admin & Academic Manager Team Scope) ──
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column: Review Queue (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Antrean Review Tugas & Bukti Kontributor
                </h4>
              </div>
              <Link to="/tasks" className="text-[11px] font-bold text-[#1B3FAB] hover:underline">
                Buka Papan Kanban →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-3 custom-scrollbar">
              {!stats?.pendingReviewTasks || stats.pendingReviewTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-[#0F172A]">Antrean review bersih!</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Semua pengajuan tugas kontributor telah ditinjau.</p>
                </div>
              ) : (
                stats.pendingReviewTasks.map((t) => (
                  <div
                    key={t.id}
                    className="border border-amber-200/70 bg-amber-50/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#64748B]">
                        <span>Oleh: {t.assignee}</span>
                        <span>•</span>
                        <span>Tipe: {t.type.toUpperCase()}</span>
                        {t.deadline && (
                          <>
                            <span>•</span>
                            <span>Tenggat: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {t.proofUrl && (
                        <a
                          href={t.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-[#1B3FAB] bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          Lihat Bukti <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Link
                        to="/tasks"
                        className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-lg shadow-xs"
                      >
                        Tinjau
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Subtest Distribution or Pie Chart (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-[#1B3FAB]" />
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Sebaran Bank Soal per Subtes
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-2.5 custom-scrollbar">
              {!stats?.subtestDistribution || stats.subtestDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                  <p className="text-xs text-slate-400 italic">Belum ada data subtes soal.</p>
                </div>
              ) : (
                stats.subtestDistribution.map((sub, idx) => {
                  const maxCount = Math.max(...stats.subtestDistribution!.map((s) => s.count), 1);
                  const pct = Math.round((sub.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F172A] truncate max-w-[180px]">{sub.name}</span>
                        <span className="font-black text-[#1B3FAB]">{sub.count} soal</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1B3FAB] to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Status Tugas Global Chart (For Team Perspective) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-[#1B3FAB]" />
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              {isPersonalMode ? 'Persentase Status Tugas Saya' : 'Persentase Status Tugas Tim'}
            </h4>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Global Recent Submissions Overview (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Riwayat Pengumpulan Seluruh Tim
              </h4>
            </div>
            <Link to="/tasks" className="text-[11px] font-bold text-[#1B3FAB] hover:underline">
              Buka Semua Tugas →
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 pr-1 space-y-2.5 custom-scrollbar">
            {tasks
              .filter((t) => t.status === 'REVIEW' || t.status === 'DONE')
              .slice(0, 6)
              .map((t) => (
                <div
                  key={t.id}
                  className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-semibold">
                      <span>PIC: {t.assignee?.name || 'Belum ditugaskan'}</span>
                      <span>•</span>
                      <span>Tipe: {t.type.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        t.status === 'DONE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {t.status === 'DONE' ? 'SELESAI' : 'REVIEW'}
                    </span>
                    {t.proofUrl && (
                      <a
                        href={t.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#1B3FAB] hover:underline flex items-center gap-0.5"
                      >
                        Lihat Bukti <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Akses Cepat Modul (Full-width Grid) ── */}
      <div className="space-y-3.5">
        <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Akses Cepat Modul</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {allowedFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Link
                key={idx}
                to={feat.link}
                className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#1B3FAB]/40 transition-all flex gap-3.5 group"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${feat.color}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-[#1B3FAB] transition-colors truncate">
                      {feat.title}
                    </h4>
                    {feat.badge && (
                      <span className="text-[8px] bg-[#EDE9FE] text-[#5B21B6] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed truncate font-semibold">
                    {feat.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
