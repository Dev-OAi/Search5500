import React from 'react';
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
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
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
