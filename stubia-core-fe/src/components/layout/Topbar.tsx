import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Bell, Menu, ChevronDown, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  link: string;
  read: boolean;
}

interface TopbarProps {
  isCollapsed: boolean;
  onMenuClick?: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  isCollapsed, 
  onMenuClick,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll
}) => {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return {
          gradient: 'from-[#1B3FAB] via-indigo-600 to-sky-500',
          badge: 'bg-blue-50 text-[#1B3FAB] border-blue-200',
          label: 'Super Admin',
        };
      case 'academic_manager':
        return {
          gradient: 'from-purple-700 via-purple-600 to-indigo-500',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Academic Manager',
        };
      case 'content_creator':
        return {
          gradient: 'from-emerald-600 via-teal-600 to-emerald-500',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Content Creator',
        };
      case 'hr_ops':
        return {
          gradient: 'from-amber-600 via-orange-600 to-amber-500',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'HR & Ops',
        };
      case 'finance_officer':
        return {
          gradient: 'from-cyan-600 via-blue-600 to-teal-600',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          label: 'Finance Officer',
        };
      default:
        return {
          gradient: 'from-slate-600 to-slate-800',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Staff',
        };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleStyle = getRoleBadgeStyle(user?.role);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    clearAuth();
    navigate('/login');
  };

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          toast.success('Notifikasi berhasil diaktifkan!');
          window.dispatchEvent(new CustomEvent('sync-push-subscription'));
        } else if (permission === 'denied') {
          toast.error('Izin notifikasi ditolak. Harap aktifkan di pengaturan browser.');
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/questions/create')) return 'Bank Soal / Buat Soal';
    if (path.startsWith('/questions/edit')) return 'Bank Soal / Edit Soal';
    if (path === '/questions') return 'Bank Soal';
    if (path === '/ai-generator/skills') return 'AI Generator / Library Skill';
    if (path === '/ai-generator') return 'AI Generator';
    if (path === '/tasks') return 'Kanban Tasks';
    if (path === '/finance') return 'Finance & Kas';
    if (path === '/blueprint') return 'Blueprint & Dokumen';
    if (path === '/events') return 'Event Timeline';
    if (path === '/chat') return 'Chat Room';
    if (path === '/users') return 'Manajemen Akun';

    const cleanPath = path.substring(1);
    return cleanPath
      .split('/')
      .map(segment => segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .join(' / ');
  };

  return (
    <header className={`h-14 bg-white border-b border-[#CBD5E1] flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 z-20 transition-all duration-300 left-0 ${
      isCollapsed ? 'md:left-16' : 'md:left-60'
    }`}>
      {/* Page Title / Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          title="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm sm:text-base font-extrabold text-[#0F172A] tracking-tight truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Enable Notification Button (For iOS/Android Mobile click-gesture requirement) */}
        {typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default' && (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all rounded-lg text-[10px] font-extrabold shadow-sm shrink-0"
            title="Aktifkan Notifikasi di HP Anda"
          >
            <Bell className="h-3.5 w-3.5 animate-bounce text-amber-600" />
            <span className="hidden sm:inline">Aktifkan Notifikasi</span>
            <span className="sm:hidden">Aktifkan</span>
          </button>
        )}

        {/* Notifications Bell Dropdown container */}
        <div className="relative">
          {/* Notifications Bell Button */}
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative text-[#64748B] hover:text-[#1B3FAB] transition-colors p-1.5 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center"
            title="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[8px] font-bold border border-white shrink-0 scale-90">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#CBD5E1] rounded-2xl shadow-xl z-50 text-xs font-bold text-slate-800 divide-y divide-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 flex items-center justify-between bg-slate-50/50">
                <span className="font-extrabold text-[#0F172A]">Notifikasi</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      onMarkAllRead();
                      setIsDropdownOpen(false);
                    }}
                    className="text-[10px] text-[#1B3FAB] hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-semibold italic">
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        onMarkRead(n.id);
                        setIsDropdownOpen(false);
                        navigate(n.link);
                      }}
                      className={`p-3.5 flex gap-2.5 hover:bg-slate-50/30 cursor-pointer transition-colors ${!n.read ? 'bg-[#1B3FAB]/3' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-full bg-[#1B3FAB]/10 text-[#1B3FAB] flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-3 py-2 bg-slate-50/50 text-center">
                  <button 
                    onClick={() => {
                      onClearAll();
                      setIsDropdownOpen(false);
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-extrabold"
                  >
                    Hapus Semua Riwayat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Avatar with Interactive Popover */}
        <div ref={profileRef} className="relative pl-2 sm:pl-3 border-l border-[#CBD5E1]">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 -mr-1 rounded-xl hover:bg-slate-100/80 transition-all duration-150 focus:outline-none group select-none"
            title="Menu Akun & Profil"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0F172A] leading-tight group-hover:text-[#1B3FAB] transition-colors">
                {user?.name}
              </p>
              <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider mt-0.5 ${roleStyle.badge}`}>
                {roleStyle.label}
              </span>
            </div>

            {/* Avatar with Vibrant Gradient & Status Indicator */}
            <div className="relative shrink-0">
              <div
                className={`h-9 w-9 rounded-full bg-gradient-to-tr ${roleStyle.gradient} text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-white group-hover:ring-[#1B3FAB]/30 transition-all duration-200 group-hover:scale-105`}
              >
                {getInitials(user?.name)}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 hidden sm:block ${
                isProfileOpen ? 'rotate-180 text-[#1B3FAB]' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white border border-[#CBD5E1] rounded-2xl shadow-xl z-50 text-xs text-[#0F172A] divide-y divide-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header with big avatar and info */}
              <div className="p-4 bg-gradient-to-b from-slate-50 to-white flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`h-11 w-11 rounded-full bg-gradient-to-tr ${roleStyle.gradient} text-white flex items-center justify-center font-black text-sm shadow-md ring-2 ring-white`}
                  >
                    {getInitials(user?.name)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-[#0F172A] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-[#64748B] font-medium truncate mt-0.5">
                    {user?.email}
                  </p>
                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider mt-1.5 ${roleStyle.badge}`}>
                    {roleStyle.label}
                  </span>
                </div>
              </div>

              {/* Status Section */}
              <div className="px-4 py-2.5 bg-[#F8FAFC]/70 flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Status Akun
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                  Online & Terverifikasi
                </span>
              </div>

              {/* Action Buttons */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
