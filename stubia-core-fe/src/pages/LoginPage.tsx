import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { GraduationCap } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: zod.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormFields = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-[#1B3FAB] text-white rounded-2xl flex items-center justify-center shadow-lg border border-[#CBD5E1]">
            <GraduationCap className="h-10 w-10 text-sky-300" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Stubia <span className="text-[#1B3FAB]">Core</span>
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-[#64748B]">
          ERP & LMS Engine Back-Office Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md rounded-2xl border border-[#CBD5E1] sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Alamat Email"
              type="email"
              placeholder="tentor@stubia.id"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Kata Sandi (Password)"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-base font-bold shadow-md"
                isLoading={isSubmitting}
              >
                Masuk ke Akun
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#CBD5E1]" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase">
                <span className="px-2 bg-white text-[#64748B]">Hak Akses Terbatas</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-[#64748B]/70 leading-normal">
              Portal internal untuk manajemen akademik stubia.id. Hubungi Admin jika Anda tidak memiliki kredensial login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
