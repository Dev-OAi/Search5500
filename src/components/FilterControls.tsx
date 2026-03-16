import React, { useMemo } from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface FilterControlsProps {
  yearFilter: string;
  setYearFilter: (year: string) => void;
  zipFilter: string;
  setZipFilter: (zip: string) => void;
  layout?: 'vertical' | 'horizontal';
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  yearFilter,
  setYearFilter,
  zipFilter,
  setZipFilter,
  layout = 'vertical'
}) => {
  const isVertical = layout === 'vertical';

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2026; // Per user request to include 2026
    // If the system date is actually ahead of 2025, we should adjust
    const maxYear = Math.max(startYear, currentYear + 1);
    const yearList = [];
    for (let y = maxYear; y >= 2010; y--) {
      yearList.push(y.toString());
    }
    return yearList;
  }, []);

  return (
    <div className={`flex ${isVertical ? 'flex-col space-y-4' : 'flex-row items-center gap-4'}`}>
      <div className={`space-y-1.5 ${isVertical ? 'w-full' : 'w-32'}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          Filing Year
        </label>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className={`space-y-1.5 ${isVertical ? 'w-full' : 'w-40'}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          Zip Code
        </label>
        <input
          type="text"
          placeholder="Enter zip..."
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
    </div>
  );
};
