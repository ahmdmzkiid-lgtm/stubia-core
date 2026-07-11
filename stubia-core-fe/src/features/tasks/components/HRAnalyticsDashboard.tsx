import React, { useEffect, useState } from 'react';
import { HRAnalyticsData } from '../types/tasks.types';
import { tasksApi } from '../api/tasksApi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Activity, Clock, Layers } from 'lucide-react';

const COLORS = ['#94A3B8', '#1B3FAB', '#F59E0B', '#10B981'];

export const HRAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<HRAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tasksApi
      .getHRAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Memuat statistik analisis...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Cards stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat 1 */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-[#1B3FAB] rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Jam Kerja Terlacak</span>
            <h4 className="text-xl font-extrabold text-[#0F172A] mt-0.5">
              {data.hoursPerEmployee.reduce((sum, item) => sum + item.hours, 0).toFixed(1)}j
            </h4>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Volume Tugas Aktif</span>
            <h4 className="text-xl font-extrabold text-[#0F172A] mt-0.5">
              {data.taskVolumeByStatus.reduce((sum, item) => sum + item.value, 0)} Tugas
            </h4>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Rata-rata Penyelesaian</span>
            <h4 className="text-xl font-extrabold text-[#0F172A] mt-0.5">
              {data.averageCompletionDays ? `${data.averageCompletionDays} Hari / Tugas` : '0 Hari / Tugas'}
            </h4>
          </div>
        </div>
      </div>

      {/* Recharts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Logged Hours per Employee */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Waktu Kerja per Karyawan (Jam)</h4>
          
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hoursPerEmployee} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="hours" fill="#1B3FAB" radius={[4, 4, 0, 0]} barSize={40} name="Jam Kerja" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task status ratio */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Rasio Status Tugas</h4>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.taskVolumeByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.taskVolumeByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Kecepatan Penyelesaian */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Durasi Penyelesaian per Tugas (Selesai)</h4>
        {data.avgCompletionVelocity && data.avgCompletionVelocity.length > 0 ? (
          <div className="divide-y divide-[#E2E8F0] text-sm">
            {data.avgCompletionVelocity.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5">
                <span className="font-medium text-[#334155]">{item.name}</span>
                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs">{item.days} Hari</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#64748B] italic">Belum ada tugas dengan status DONE di database.</p>
        )}
      </div>
    </div>
  );
};
export default HRAnalyticsDashboard;
