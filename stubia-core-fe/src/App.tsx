import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardHome } from './pages/DashboardHome';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { GeneratePanel } from './features/ai-generator/components/GeneratePanel';
import { SkillLibrary } from './features/ai-generator/components/SkillLibrary';
import { QuestionTable } from './features/questions/components/QuestionTable';
import { QuestionEditor } from './features/questions/components/QuestionEditor';
import { PackageGeneratorDashboard } from './features/packages/components/PackageGeneratorDashboard';
import { TasksDashboard } from './features/tasks/components/TasksDashboard';
import { FinanceModule } from './features/finance/components/FinanceModule';
import { BlueprintModule } from './features/documents/components/BlueprintModule';
import { EventsTimeline } from './features/events/components/EventsTimeline';
import { ChatDashboard } from './features/chat/components/ChatDashboard';
import { UserManagement } from './features/users/components/UserManagement';
import { ChatNotificationProvider } from './features/chat/components/ChatNotificationProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const { setAuth, clearAuth, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
        });
        const result = await res.json();
        
        if (res.ok && result.success) {
          setAuth(result.data.accessToken, result.data.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [setAuth, clearAuth, setIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-4 text-sm font-semibold text-[#64748B] animate-pulse">Menghubungkan ke Server...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main Panel Routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <ChatNotificationProvider>
                  <DashboardLayout />
                </ChatNotificationProvider>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="questions" element={<QuestionTable />} />
            <Route path="questions/create" element={<QuestionEditor />} />
            <Route path="questions/edit/:id" element={<QuestionEditor />} />
            <Route path="ai-generator" element={<GeneratePanel />} />
            <Route path="ai-generator/skills" element={<SkillLibrary />} />
            <Route path="packages" element={<RequireAuth allowedRoles={['super_admin', 'academic_manager']}><PackageGeneratorDashboard /></RequireAuth>} />
            <Route path="tasks" element={<TasksDashboard />} />
            <Route path="finance" element={<RequireAuth allowedRoles={['super_admin', 'finance_officer']}><FinanceModule /></RequireAuth>} />
            <Route path="blueprint" element={<BlueprintModule />} />
            <Route path="events" element={<EventsTimeline />} />
            <Route path="chat" element={<ChatDashboard />} />
            <Route path="users" element={<RequireAuth allowedRoles={['super_admin']}><UserManagement /></RequireAuth>} />
          </Route>

          {/* Catch all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif' },
          duration: 4000,
        }}
      />
    </QueryClientProvider>
  );
};

export default App;
