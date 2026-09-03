import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  KanbanSquare,
  Wallet2,
  FolderOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  UserCog,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const isChildActive = ['/questions', '/ai-generator'].includes(location.pathname);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(isChildActive);
  const [totalUnread, setTotalUnread] = useState<number>(0);

  const calculateTotalUnread = () => {
    try {
      const stored = localStorage.getItem('chat-unread-counts');
      if (stored) {
        const counts = JSON.parse(stored);
        const total = Object.values(counts).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        setTotalUnread(total);
      } else {
        setTotalUnread(0);
      }
    } catch {
      setTotalUnread(0);
    }
  };

  useEffect(() => {
    calculateTotalUnread();

    const handleUpdate = () => calculateTotalUnread();
    window.addEventListener('chat-unread-updated', handleUpdate);
    window.addEventListener('chat-unread-cleared', handleUpdate);

    return () => {
      window.removeEventListener('chat-unread-updated', handleUpdate);
      window.removeEventListener('chat-unread-cleared', handleUpdate);
    };
  }, []);

  const handleLinkClick = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Auto-expand if active child changes
  useEffect(() => {
    if (isChildActive) {
      setIsGeneratorOpen(true);
    }
  }, [location.pathname, isChildActive]);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    clearAuth();
  };

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

  interface MenuItem {
    name: string;
    path?: string;
    icon: any;
    roles: string[];
    children?: Array<{
      name: string;
      path: string;
      icon: any;
      roles: string[];
    }>;
  }

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      name: 'Generator Soal',
      icon: BookOpen,
      roles: ['super_admin', 'academic_manager', 'content_creator'],
      children: [
        {
          name: 'Bank Soal',
          path: '/questions',
          icon: BookOpen,
          roles: ['super_admin', 'academic_manager', 'content_creator'],
        },
        {
          name: 'AI Generator',
          path: '/ai-generator',
          icon: Sparkles,
          roles: ['super_admin', 'academic_manager', 'content_creator'],
        },
      ],
    },
    {
      name: 'Kanban Tasks',
      path: '/tasks',
      icon: KanbanSquare,
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      name: 'Finance',
      path: '/finance',
      icon: Wallet2,
      roles: ['super_admin', 'finance_officer'],
    },
    {
      name: 'Blueprint & Docs',
      path: '/blueprint',
      icon: FolderOpen,
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      name: 'Event Timeline',
      path: '/events',
      icon: CalendarDays,
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      name: 'Chat Room',
      path: '/chat',
      icon: MessageSquare,
      roles: ['super_admin', 'academic_manager', 'content_creator', 'hr_ops', 'finance_officer'],
    },
    {
      name: 'Manajemen Akun',
      path: '/users',
      icon: UserCog,
      roles: ['super_admin'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-white text-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shadow-sm border-r border-[#CBD5E1] ${
        isCollapsed ? 'w-16' : 'w-60'
      } ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div>
        {/* Header / Logo using official Stubia.id Brand Icon */}
        <div className="h-14 flex items-center justify-center px-4 border-b border-[#CBD5E1]">
          {isCollapsed ? (
            <img
              src="/favicon.png"
              alt="Stubia"
              className="h-7 w-7 object-contain drop-shadow-xs"
            />
          ) : (
            <img
              src="/stubiabrandicon.webp"
              alt="Stubia.id"
              className="h-7 w-auto object-contain"
            />
          )}
        </div>

        {/* Nav Links - Styled professionally without generic AI purple highlighting */}
        <nav className="mt-4 px-2 space-y-1.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            
            // Check if this is the "Generator Soal" parent item
            if (item.name === 'Generator Soal') {
              const hasActiveChild = item.children?.some(child => location.pathname === child.path);
              return (
                <div key={item.name} className="space-y-1">
                  {/* Parent Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setIsGeneratorOpen(true);
                      } else {
                        setIsGeneratorOpen(!isGeneratorOpen);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none group ${
                      hasActiveChild
                        ? 'bg-[#1B3FAB]/5 text-[#1B3FAB]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#1B3FAB]'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${hasActiveChild ? 'text-[#1B3FAB]' : 'text-slate-400 group-hover:text-[#1B3FAB]'}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 ${
                          isGeneratorOpen ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Children Submenu */}
                  {isGeneratorOpen && !isCollapsed && (
                    <div className="pl-4 space-y-1.5 border-l border-slate-100 ml-5.5 py-0.5">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        // Check if user role matches child role
                        if (!user || !child.roles.includes(user.role)) return null;
                        
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                              `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-150 select-none ${
                                isActive
                                  ? 'bg-[#1B3FAB]/8 text-[#1B3FAB] font-extrabold'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1B3FAB]'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <ChildIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#1B3FAB]' : 'text-slate-400 group-hover:text-[#1B3FAB]'}`} />
                                <span>{child.name}</span>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Normal Flat Item
            return (
              <NavLink
                key={item.path || ''}
                to={item.path || ''}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `relative group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                    isActive
                      ? 'bg-[#1B3FAB]/8 text-[#1B3FAB] font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#1B3FAB]'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#1B3FAB]' : 'text-slate-400 group-hover:text-[#1B3FAB]'}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {item.name === 'Chat Room' && totalUnread > 0 && (
                      <span className={`bg-rose-500 text-white font-extrabold rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        isCollapsed
                          ? 'absolute top-1.5 right-1.5 h-4 w-4 text-[8px]'
                          : 'h-5 min-w-[20px] px-1 text-[10px]'
                      }`}>
                        {totalUnread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer controls */}
      <div className="p-2 border-t border-[#CBD5E1] space-y-1 bg-slate-50/50">
        {/* User Profile Card in Sidebar */}
        {user && (
          <div className="mb-2">
            {!isCollapsed ? (
              <div className="p-2 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div
                    className={`h-8 w-8 rounded-full bg-gradient-to-tr ${roleStyle.gradient} text-white flex items-center justify-center font-black text-[11px] shadow-xs ring-1 ring-white`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#0F172A] truncate leading-tight">
                    {user.name}
                  </p>
                  <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider mt-0.5 ${roleStyle.badge}`}>
                    {roleStyle.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={`${user.name} (${roleStyle.label})`}>
                <div className="relative">
                  <div
                    className={`h-8 w-8 rounded-full bg-gradient-to-tr ${roleStyle.gradient} text-white flex items-center justify-center font-black text-[11px] shadow-xs ring-1 ring-white`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-150 select-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
            <div className="flex items-center gap-3 w-full font-bold text-xs">
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Sembunyikan Menu</span>
            </div>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 select-none"
          title="Keluar / Logout"
        >
          {isCollapsed ? <LogOut className="h-5 w-5" /> : (
            <div className="flex items-center gap-3 w-full font-bold text-xs">
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Keluar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
