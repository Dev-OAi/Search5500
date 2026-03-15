import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PlanData } from '../types';

interface CompactFilingCardProps {
  plan: PlanData;
  isSelected: boolean;
  onSelect: (plan: PlanData) => void;
}

export const CompactFilingCard: React.FC<CompactFilingCardProps> = ({ plan, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(plan)}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        isSelected
          ? "bg-emerald-50 border-emerald-500 shadow-sm"
          : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase">
          {plan.planYear}
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "rotate-90 text-emerald-500" : "text-slate-300"}`} />
      </div>
      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">{plan.planName}</h3>
      <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mb-3">{plan.sponsorName}</p>

      <div className="flex items-center gap-4">
        <div>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Assets</p>
          <p className="text-xs font-bold text-slate-700">${(plan.assets / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Participants</p>
          <p className="text-xs font-bold text-slate-700">{plan.participantsEoy.toLocaleString()}</p>
        </div>
      </div>
    </button>
  );
};
