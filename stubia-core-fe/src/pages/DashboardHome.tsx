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
  ExternalLink
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
    tasksAssigned: number;
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
  finance: {
    debit: number;
    kredit: number;
    balance: number;
  };
  aiUsage: {
    cost: number;
    tokens: number;
  };
  recentActivities: {
    questions: Array<{
      id: string;
      title: string;
      creator: string;
      time: string;
      status: string;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      assignee: string;
      time: string;
      status: string;
    }>;
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

  const COLORS = ['#64748B', '#F59E0B', '#10B981']; // Slate (Belum Dikerjakan), Amber (Review), Emerald (Done)

  const totalTasks = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const reviewCount = tasks.filter((t) => t.status === 'REVIEW').length;
  const todoCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'BACKLOG').length;

  const pieData = [
    { name: 'Belum Dikerjakan', value: todoCount },
    { name: 'Menunggu Review', value: reviewCount },
    { name: 'Selesai & Disetujui', value: doneCount },
  ];

  const submissions = tasks
    .filter((t) => t.status === 'REVIEW' || t.status === 'DONE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
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
      maximumFractionDigits: 0
    }).format(val);
  };





  return (
    <div className="space-y-6">
      
      {/* ── Welcome Banner with Real-time Sync Indicator ── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50/20 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Selamat Datang, {user?.name}!
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-semibold">
            Peran: <span className="text-[#1B3FAB] font-extrabold uppercase">{ROLE_LABELS[user?.role || ''] || user?.role}</span> • Sistem disinkronkan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#1B3FAB]/10 px-4 py-2 rounded-xl text-[#1B3FAB] border border-[#1B3FAB]/20 shrink-0 font-bold text-[10px] uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Dynamic KPI Metrics (Tailored to Role) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Soal UTBK */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Bank Soal</p>
          <p className="text-3xl font-black text-[#0F172A] mt-2.5">{stats?.totals.questions || 0} <span className="text-xs font-bold text-slate-400">soal</span></p>
          <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
            <span className="text-[#10B981]">{stats?.userStats.questionsCreated || 0}</span>
            <span>dibuat oleh Anda</span>
          </div>
        </div>

        {/* Metric 2: Kanban Tasks */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Tugas Kanban</p>
          <p className="text-3xl font-black text-[#0F172A] mt-2.5">{stats?.totals.tasks || 0} <span className="text-xs font-bold text-slate-400">tugas</span></p>
          <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
            <span className="text-[#F59E0B]">{stats?.userStats.tasksAssigned || 0}</span>
            <span>ditugaskan ke Anda</span>
          </div>
        </div>

        {/* Metric 3: Role Specific Finance OR Event Stats */}
        {user?.role === 'super_admin' || user?.role === 'finance_officer' ? (
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Wallet2 className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Saldo Ledger Perusahaan</p>
            <p className="text-xl font-black text-[#0F172A] mt-3.5 truncate" title={formatRupiah(stats?.finance.balance || 0)}>
              {formatRupiah(stats?.finance.balance || 0)}
            </p>
            <div className="flex items-center gap-1.5 mt-3.5 text-[9px] font-extrabold uppercase text-[#64748B]">
              <span className="text-emerald-600">IN: {formatRupiah(stats?.finance.debit || 0)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Jadwal Event Tryout</p>
            <p className="text-3xl font-black text-[#0F172A] mt-2.5">{stats?.totals.events || 0} <span className="text-xs font-bold text-slate-400">event</span></p>
            <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
              <span>Linimasa tryout aktif akademik</span>
            </div>
          </div>
        )}

        {/* Metric 4: AI cost for Admins, Users count for others */}
        {user?.role === 'super_admin' ? (
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Biaya AI</p>
            <p className="text-3xl font-black text-[#7C3AED] mt-2.5">${stats?.aiUsage.cost.toFixed(2) || '0.00'}</p>
            <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
              <span>Digenerasi dari {stats?.aiUsage.tokens.toLocaleString() || 0} tokens</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-4 top-4 h-9 w-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Karyawan Aktif</p>
            <p className="text-3xl font-black text-[#0F172A] mt-2.5">{stats?.totals.users || 0} <span className="text-xs font-bold text-slate-400">karyawan</span></p>
            <div className="flex items-center gap-1 mt-3.5 text-[10px] font-bold text-[#64748B]">
              <span>Kolaborator aktif stubia-core</span>
            </div>
          </div>
        )}

      </div>

      {/* ── Quick Stats Charts & Submissions Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column: Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-[#1B3FAB]" />
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Persentase Status Tugas</h4>
          </div>

          {totalTasks === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] text-center">
              <p className="text-xs text-slate-400 italic">Tidak ada data tugas.</p>
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
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
          )}
        </div>

        {/* Right Column: Submission History Card (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Riwayat Pengumpulan Tugas</h4>
          </div>

          <div className="flex-1 overflow-y-auto max-h-60 pr-1 space-y-3 custom-scrollbar">
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[220px] text-center">
                <p className="text-xs text-slate-400 italic">Belum ada tugas yang dikumpulkan.</p>
              </div>
            ) : (
              submissions.map((t) => (
                <div 
                  key={t.id} 
                  className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#64748B]">
                      <span>PIC: {t.assignee?.name || 'Belum ditugaskan'}</span>
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

                  <div className="flex items-center gap-3 self-end sm:self-auto">
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
                        Lihat Bukti <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
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
