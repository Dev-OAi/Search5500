import React, { useState } from 'react';
import { ChevronRight, MapPin, Info, ExternalLink, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanData } from '../types';

interface CompactFilingCardProps {
  plan: PlanData;
  isSelected: boolean;
  onSelect: (plan: PlanData) => void;
  hidePlanName?: boolean;
}

export const CompactFilingCard: React.FC<CompactFilingCardProps> = ({ plan, isSelected, onSelect, hidePlanName }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(plan)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full text-left p-3.5 rounded-xl border transition-all relative z-20 ${
          isSelected
            ? "bg-emerald-50 border-emerald-500 shadow-sm"
            : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50"
        }`}
      >
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase">
            {plan.planYear}
          </span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-90 text-emerald-500" : "text-slate-300"}`} />
        </div>
        {!hidePlanName && (
          <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight mb-0.5">{plan.planName}</h3>
        )}
        <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mb-2">{plan.sponsorName}</p>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <div className="min-w-[50px]">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Assets</p>
            <p className="text-[11px] font-bold text-slate-700">${(plan.assets / 1000000).toFixed(1)}M</p>
          </div>
          <div className="min-w-[50px]">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Participants</p>
            <p className="text-[11px] font-bold text-slate-700">{plan.participantsEoy.toLocaleString()}</p>
          </div>
        </div>
      </button>

      {/* Hover Popout */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 20 }}
            exit={{ opacity: 0, scale: 0.95, x: 10 }}
            className="absolute left-full top-0 ml-2 w-72 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-5 z-50 pointer-events-none hidden lg:block"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Info className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Details</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {plan.address}<br />
                  {plan.city}, {plan.state} {plan.zip}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">BOY Assets</p>
                  <p className="text-xs font-bold text-slate-700">${(plan.assetsBoy / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Net Change</p>
                  <p className={`text-xs font-bold ${plan.assets - plan.assetsBoy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {plan.assets - plan.assetsBoy >= 0 ? '+' : ''}{((plan.assets - plan.assetsBoy) / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Filing Insights</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Ack ID</span>
                    <span className="text-[10px] font-mono text-slate-400">{plan.ackId.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Plan Type</span>
                    <span className="text-[10px] text-slate-700 font-bold">{plan.planType || 'Retirement'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                <TrendingUp className="w-3.5 h-3.5" />
                Click for Full Analysis
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
