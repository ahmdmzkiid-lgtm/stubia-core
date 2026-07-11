import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../../store/authStore';

interface RequireAuthProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-4 text-sm font-semibold text-[#64748B] animate-pulse">Memuat Sesi Pengguna...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page, saving the location we tried to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
