import React, { useState } from 'react';
import { SortAsc, SortDesc, Layers, Filter, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FilterControls } from './FilterControls';

interface ListActionHeaderProps {
  sortBy: 'year' | 'assets' | 'name';
  setSortBy: (sort: 'year' | 'assets' | 'name') => void;
  isGrouped: boolean;
  setIsGrouped: (grouped: boolean) => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  zipFilter: string;
  setZipFilter: (zip: string) => void;
  totalResults: number;
}

export const ListActionHeader: React.FC<ListActionHeaderProps> = ({
  sortBy,
  setSortBy,
  isGrouped,
  setIsGrouped,
  yearFilter,
  setYearFilter,
  zipFilter,
  setZipFilter,
  totalResults
}) => {
  const [activePopover, setActivePopover] = useState<'sort' | 'group' | 'filter' | null>(null);

  const togglePopover = (popover: 'sort' | 'group' | 'filter') => {
    setActivePopover(activePopover === popover ? null : popover);
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Search Results ({totalResults})
          </h2>
          <div className="flex items-center gap-2">
            {/* Sort Button */}
            <div className="relative">
              <button
                onClick={() => togglePopover('sort')}
                className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold ${
                  activePopover === 'sort' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <SortDesc className="w-3.5 h-3.5" />
                Sort
              </button>
              <AnimatePresence>
                {activePopover === 'sort' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActivePopover(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Sort By
                      </div>
                      {[
                        { id: 'year', label: 'Newest Year', icon: SortDesc },
                        { id: 'assets', label: 'Assets (High-Low)', icon: SortDesc },
                        { id: 'name', label: 'Name (A-Z)', icon: SortAsc },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => { setSortBy(option.id as any); setActivePopover(null); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            sortBy === option.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <option.icon className="w-3.5 h-3.5" />
                            {option.label}
                          </div>
                          {sortBy === option.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Group Button */}
            <div className="relative">
              <button
                onClick={() => togglePopover('group')}
                className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold ${
                  activePopover === 'group' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Group
              </button>
              <AnimatePresence>
                {activePopover === 'group' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActivePopover(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Grouping
                      </div>
                      <button
                        onClick={() => { setIsGrouped(!isGrouped); setActivePopover(null); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                          isGrouped ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5" />
                          Group by Plan (EIN)
                        </div>
                        {isGrouped && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Toggle (for mobile/compact view if needed, but we have always visible filters) */}
            <div className="relative lg:hidden">
              <button
                onClick={() => togglePopover('filter')}
                className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold ${
                  activePopover === 'filter' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
              <AnimatePresence>
                {activePopover === 'filter' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActivePopover(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Quick Filters
                        </div>
                        <button onClick={() => setActivePopover(null)}>
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <FilterControls
                        yearFilter={yearFilter}
                        setYearFilter={setYearFilter}
                        zipFilter={zipFilter}
                        setZipFilter={setZipFilter}
                        layout="vertical"
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Always visible filters for desktop/tablet */}
        <div className="hidden lg:block border-t border-slate-50 pt-4">
          <FilterControls
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            zipFilter={zipFilter}
            setZipFilter={setZipFilter}
            layout="horizontal"
          />
        </div>
      </div>
    </div>
  );
};
