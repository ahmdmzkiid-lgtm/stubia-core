import React from 'react';
import { AISkill } from '../types/aiGenerator.types';
import { useAuthStore } from '../../../store/authStore';
import { BookOpen, Tag, Edit, Trash2 } from 'lucide-react';

interface SkillCardProps {
  skill: AISkill;
  onEdit?: (skill: AISkill) => void;
  onDelete?: (id: string) => void;
  onUse?: (skill: AISkill) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onEdit, onDelete, onUse }) => {
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'super_admin' || user?.role === 'academic_manager';

  return (
    <div className="bg-white border border-[#CBD5E1] border-t-4 border-t-[#7C3AED] rounded-xl shadow-sm p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Header Title */}
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-base font-bold text-[#0F172A] line-clamp-1" title={skill.namaSkill}>
            {skill.namaSkill}
          </h4>
          <span className="text-[10px] bg-[#EDE9FE] text-[#5B21B6] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
            {skill.versi}
          </span>
        </div>

        {/* Subtest details */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B] font-semibold">
          <BookOpen className="h-4 w-4 text-[#7C3AED]" />
          <span>{skill.subtes}</span>
        </div>

        {/* Topics tag */}
        <div className="mt-2 flex items-start gap-1.5 text-xs text-[#64748B]">
          <Tag className="h-4 w-4 mt-0.5 text-[#7C3AED] shrink-0" />
          <div className="flex flex-wrap gap-1">
            {skill.topikCakupanJson.slice(0, 3).map((topic, i) => (
              <span
                key={i}
                className="bg-[#F1F5F9] text-[#64748B] font-medium px-1.5 py-0.5 rounded text-[10px] border border-[#CBD5E1]/50"
              >
                {topic}
              </span>
            ))}
            {skill.topikCakupanJson.length > 3 && (
              <span className="text-[10px] font-semibold text-[#7C3AED]">
                +{skill.topikCakupanJson.length - 3} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Prompt Preview */}
        <p className="mt-3 text-xs text-[#64748B] line-clamp-3 leading-normal border-l-2 border-[#7C3AED]/20 pl-2 font-medium">
          {skill.instruksiSoal}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-[#CBD5E1]/50 flex items-center justify-between gap-2">
        {/* Actions for super-admin/manager */}
        <div className="flex items-center gap-1.5">
          {isManagerOrAdmin && onEdit && (
            <button
              onClick={() => onEdit(skill)}
              className="text-[#64748B] hover:text-[#1B3FAB] p-1.5 rounded-md hover:bg-[#F1F5F9] transition-colors"
              title="Edit Skill"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {user?.role === 'super_admin' && onDelete && (
            <button
              onClick={() => onDelete(skill.id)}
              className="text-[#64748B] hover:text-[#EF4444] p-1.5 rounded-md hover:bg-red-50 transition-colors"
              title="Hapus / Arsipkan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action selector */}
        {onUse && (
          <button
            onClick={() => onUse(skill)}
            className="text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm focus:outline-none flex items-center gap-1 active:scale-[0.97]"
          >
            <span>Gunakan Prompt</span>
          </button>
        )}
      </div>
    </div>
  );
};
