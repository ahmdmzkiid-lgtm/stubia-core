import React, { useState } from 'react';
import { VisionMissionEditor } from './VisionMissionEditor';
import { OKRTracker } from './OKRTracker';
import { DocumentDrive } from './DocumentDrive';
import { Target, Compass, HardDrive, LayoutDashboard } from 'lucide-react';

export const BlueprintModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vm' | 'okr' | 'drive'>('drive');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-[#1B3FAB]" />
          <h2 className="text-xl font-bold text-[#0F172A]">Blueprint & Dokumen</h2>
        </div>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Pusat visi misi strategis, monitoring progress sasaran kerja OKR, dan penyimpanan dokumen SOP & legal terlindungi.
        </p>
      </div>

      {/* Toolbar tabs selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 self-start max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('drive')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'drive'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>Document Drive</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('okr')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'okr'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>OKR Tracker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vm')}
          className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
            activeTab === 'vm'
              ? 'bg-white text-[#1B3FAB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Visi Misi</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'drive' ? (
          <DocumentDrive />
        ) : activeTab === 'okr' ? (
          <OKRTracker />
        ) : (
          <VisionMissionEditor />
        )}
      </div>
    </div>
  );
};
export default BlueprintModule;
