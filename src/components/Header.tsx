import React from 'react';
import { Menu, Search, Upload, Database, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onToggleSidebar: () => void;
  onUploadClick: () => void;
  lastUpdated: string | null;
  selectedPlan: any;
  onToggleRightSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  onToggleSidebar,
  onUploadClick,
  lastUpdated,
  selectedPlan,
  onToggleRightSidebar
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg lg:hidden">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">Form 5500 Analyzer</h1>
                {lastUpdated && (
                  <p className="text-[9px] text-slate-400 font-medium">
                    Updated: {lastUpdated}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plan, sponsor, or EIN..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUploadClick}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Upload CSV"
          >
            <Upload className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {selectedPlan && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onToggleRightSidebar}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors lg:hidden"
              >
                <FileText className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
