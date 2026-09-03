import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: zod.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormFields = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormFields) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Login gagal. Periksa kembali email dan password Anda.');
      }

      const { accessToken, user } = result.data;
      setAuth(accessToken, user);

      toast.success(`Selamat datang kembali, ${user.name}!`, {
        duration: 4000,
        position: 'top-right',
      });

      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F8FAFC] relative overflow-hidden">
      {/* Subtle ambient light accents */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-gradient-to-b from-blue-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <img
              src="/stubiabrandicon.webp"
              alt="Stubia.id"
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
              Masuk ke Akun
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              Portal internal operasional & manajemen akademik Stubia.id
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#CBD5E1]">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F172A]">
                Alamat Email Kantor
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  placeholder="nama@stubia.id"
                  className={`w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm bg-[#F8FAFC] border rounded-xl font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB]/15 focus:bg-white transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-[#CBD5E1] focus:border-[#1B3FAB]'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F172A]">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className={`w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-[#F8FAFC] border rounded-xl font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB]/15 focus:bg-white transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-[#CBD5E1] focus:border-[#1B3FAB]'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#475569] focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[#1B3FAB] hover:bg-[#15328A] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 mt-5 border-t border-[#F1F5F9] flex items-center justify-center gap-1.5 text-xs text-[#64748B] font-medium text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1B3FAB] shrink-0" />
            <span>Akses terbatas untuk staf dan tentor resmi Stubia.id</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#94A3B8] font-medium">
          &copy; {new Date().getFullYear()} PT Stubia Edukasi Indonesia. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
