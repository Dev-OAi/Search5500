import React from 'react';
import { Search, LayoutDashboard, Settings, X, Database, Filter, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FilterControls } from './FilterControls';

interface SidebarProps {
  activeTab: 'analysis' | 'dashboard';
  setActiveTab: (tab: 'analysis' | 'dashboard') => void;
  onMarketOverview: () => void;
  isOpen: boolean;
  onClose: () => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  zipFilter: string;
  setZipFilter: (zip: string) => void;
  availableZips?: string[];
  onOpenSettings: () => void;
  aiEnabled: boolean;
  hasApiKey: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onMarketOverview,
  isOpen,
  onClose,
  yearFilter,
  setYearFilter,
  zipFilter,
  setZipFilter,
  availableZips,
  onOpenSettings,
  aiEnabled,
  hasApiKey
}) => {
  return (
    <>
      <aside className={`
        fixed lg:static inset-y-0 left-0 bg-white border-r border-slate-200 w-64 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">Search 5500</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-6">
            <div className="space-y-1">
              <button
                onClick={() => { onMarketOverview(); if(window.innerWidth < 1024) onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Market Overview
              </button>

              <div className="h-px bg-slate-100 mx-3 my-4" />

              <button
                onClick={() => { setActiveTab('analysis'); if(window.innerWidth < 1024) onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                Search & Filings
              </button>
            </div>

            <div>
              <div className="px-3 mb-3 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Filter className="w-3 h-3" />
                Global Filters
              </div>
              <div className="px-3">
                <FilterControls
                  yearFilter={yearFilter}
                  setYearFilter={setYearFilter}
                  zipFilter={zipFilter}
                  setZipFilter={setZipFilter}
                  availableZips={availableZips}
                  layout="vertical"
                />
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={onOpenSettings}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                hasApiKey && aiEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-bold">AI Settings</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${hasApiKey && aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
