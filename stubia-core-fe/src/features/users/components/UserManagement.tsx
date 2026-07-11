import React, { useEffect, useState } from 'react';
import { usersApi, AppUser } from '../api/usersApi';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Pencil,
  PowerOff,
  Power,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  academic_manager: 'Academic Manager',
  content_creator: 'Content Creator',
  hr_ops: 'HR & Ops',
  finance_officer: 'Finance Officer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  academic_manager: 'bg-blue-100 text-blue-700',
  content_creator: 'bg-emerald-100 text-emerald-700',
  hr_ops: 'bg-orange-100 text-orange-700',
  finance_officer: 'bg-yellow-100 text-yellow-700',
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const DEFAULT_FORM: UserFormData = { name: '', email: '', password: '', role: 'content_creator' };

export const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserFormData>(DEFAULT_FORM);
  const [editForm, setEditForm] = useState<Partial<UserFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user?.role !== 'super_admin') {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center">
        <ShieldCheck className="h-10 w-10 text-red-400 mb-3" />
        <h3 className="text-sm font-bold text-[#0F172A]">Akses Ditolak</h3>
        <p className="text-xs text-[#64748B] mt-1">Hanya Super Admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.listUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data karyawan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchActive = showInactive ? true : u.isActive;
    return matchSearch && matchRole && matchActive;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersApi.createUser(form);
      toast.success('Akun karyawan berhasil dibuat!');
      setShowCreateModal(false);
      setForm(DEFAULT_FORM);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      await usersApi.updateUser(editTarget.id, editForm);
      toast.success('Data karyawan berhasil diperbarui!');
      setShowEditModal(false);
      setEditTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u: AppUser) => {
    try {
      if (u.isActive) {
        await usersApi.deleteUser(u.id);
        toast.success(`Akun ${u.name} dinonaktifkan`);
      } else {
        await usersApi.restoreUser(u.id);
        toast.success(`Akun ${u.name} diaktifkan kembali`);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status akun');
    }
  };

  const openEdit = (u: AppUser) => {
    setEditTarget(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setShowEditModal(true);
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1B3FAB]/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-[#1B3FAB]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Manajemen Karyawan</h2>
              <p className="text-xs font-semibold text-[#64748B]">
                Buat dan kelola akun karyawan Stubia Core
              </p>
            </div>
          </div>
          <button
            onClick={() => { setForm(DEFAULT_FORM); setShowCreateModal(true); }}
            className="flex items-center gap-2 bg-[#1B3FAB] hover:bg-[#15328A] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Karyawan
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Total Akun', value: stats.total, color: 'text-[#1B3FAB]' },
            { label: 'Aktif', value: stats.active, color: 'text-emerald-600' },
            { label: 'Nonaktif', value: stats.inactive, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-[#F8FAFC] border border-[#CBD5E1]/40 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-[#64748B] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] bg-white"
        >
          <option value="all">Semua Role</option>
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`h-9 px-3 rounded-lg border text-xs font-bold transition-colors ${
            showInactive
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-slate-50'
          }`}
        >
          {showInactive ? 'Sembunyikan Nonaktif' : 'Tampilkan Nonaktif'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-48 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#1B3FAB]" />
            <p className="mt-2 text-xs font-semibold text-[#64748B] animate-pulse">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-[#94A3B8]">
            <Users className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs font-bold">Tidak ada karyawan ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1]/50">
              <tr>
                {['Nama', 'Email', 'Role', 'Status', 'Terdaftar', 'Aksi'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-extrabold text-[#64748B] uppercase tracking-wider text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1]/30">
              {filtered.map((u) => (
                <tr key={u.id} className={`transition-colors hover:bg-slate-50/50 ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#1B3FAB]/10 flex items-center justify-center text-[#1B3FAB] font-black text-[10px]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#0F172A]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] font-semibold">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] font-semibold">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(u)}
                        className="h-7 w-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-[#1B3FAB] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                          u.isActive
                            ? 'hover:bg-red-50 text-red-500'
                            : 'hover:bg-emerald-50 text-emerald-600'
                        }`}
                        title={u.isActive ? 'Nonaktifkan' : 'Aktifkan kembali'}
                      >
                        {u.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#CBD5E1]">
            <div className="flex items-center justify-between p-5 border-b border-[#CBD5E1]/40">
              <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#1B3FAB]" /> Tambah Karyawan Baru
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {[
                { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'cth. Budi Santoso' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'cth. budi@stubia.id' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full h-9 px-3 pr-9 border border-[#CBD5E1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Role / Jabatan</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] bg-white"
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-9 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-9 rounded-lg bg-[#1B3FAB] hover:bg-[#15328A] text-white text-xs font-bold disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? 'Membuat...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#CBD5E1]">
            <div className="flex items-center justify-between p-5 border-b border-[#CBD5E1]/40">
              <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                <Pencil className="h-4 w-4 text-[#1B3FAB]" /> Edit — {editTarget.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Password Baru (opsional)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Kosongkan jika tidak berubah"
                    value={editForm.password ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full h-9 px-3 pr-9 border border-[#CBD5E1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Role</label>
                <select
                  value={editForm.role ?? editTarget.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] bg-white"
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 h-9 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 h-9 rounded-lg bg-[#1B3FAB] hover:bg-[#15328A] text-white text-xs font-bold disabled:opacity-60 transition-colors">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
