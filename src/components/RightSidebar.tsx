import React from 'react';
import { X, Database, BarChart2, Loader2, FileUp, FileText, AlertCircle, Sparkles, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { PlanData, PlanAnalysis, DeepAnalysis } from '../types';

interface RightSidebarProps {
  selectedPlan: PlanData | null;
  onClose: () => void;
  isOpen: boolean;
  analysis: PlanAnalysis | null;
  deepAnalysis: DeepAnalysis | null;
  isAnalyzing: boolean;
  isDeepAnalyzing: boolean;
  hasRequestedAnalysis: boolean;
  aiEnabled: boolean;
  hasApiKey: boolean;
  onGenerateAnalysis: () => void;
  onDeepAnalysis: (text: string) => void;
  showDeepAnalysisInput: boolean;
  setShowDeepAnalysisInput: (show: boolean) => void;
  ocrText: string;
  setOcrText: (text: string) => void;
  onOpenSettings: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void;
  isResizing: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedPlan,
  onClose,
  isOpen,
  analysis,
  deepAnalysis,
  isAnalyzing,
  isDeepAnalyzing,
  hasRequestedAnalysis,
  aiEnabled,
  hasApiKey,
  onGenerateAnalysis,
  onDeepAnalysis,
  showDeepAnalysisInput,
  setShowDeepAnalysisInput,
  ocrText,
  setOcrText,
  onOpenSettings,
  width,
  onResizeStart,
  isResizing
}) => {
  if (!selectedPlan) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${width}px` : '85%' }}
        className={`
          fixed lg:static inset-y-0 right-0 bg-white border-l border-slate-200 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
          ${isResizing ? 'select-none transition-none' : ''}
        `}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500/30 transition-colors z-50 hidden lg:block group/resize"
          title="Drag to resize"
        >
          {/* Visual Handle Tab */}
          <div className="absolute left-0 top-24 -translate-x-full pr-1 opacity-100 lg:opacity-0 lg:group-hover/resize:opacity-100 transition-opacity">
            <div className="bg-emerald-600 rounded-l-xl p-2.5 shadow-[-4px_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center border border-emerald-500 border-r-0">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">AI Intelligence</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Powered by Gemini Pro</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Deep Analysis Controls */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</h4>
                  <button
                    onClick={() => setShowDeepAnalysisInput(!showDeepAnalysisInput)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all"
                  >
                    <Database className="w-3 h-3" />
                    Toggle OCR Input
                  </button>
               </div>
            </div>

            {/* Deep Analysis Input */}
            <AnimatePresence>
              {showDeepAnalysisInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                        <FileUp className="w-4 h-4" />
                        PDF OCR Input
                      </h3>
                      <button onClick={() => setShowDeepAnalysisInput(false)}>
                        <X className="w-4 h-4 text-emerald-400 hover:text-emerald-600" />
                      </button>
                    </div>
                    <textarea
                      className="w-full h-32 p-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Paste OCR text here..."
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                    />
                    <button
                      onClick={() => onDeepAnalysis(ocrText)}
                      disabled={isDeepAnalyzing || !ocrText.trim() || !hasApiKey || !aiEnabled}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeepAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                      Generate Deep Summary
                    </button>
                    {(!hasApiKey || !aiEnabled) && (
                      <p className="text-[10px] text-center text-emerald-600 font-medium">
                        AI features are currently disabled. <button onClick={onOpenSettings} className="underline font-bold">Enable in Settings</button>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis Result */}
            {deepAnalysis ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Deep Summary</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified</span>
                </div>

                <section className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Income</p>
                      <p className="text-sm font-semibold text-slate-900">{deepAnalysis.income.total}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Expenses</p>
                      <p className="text-sm font-semibold text-slate-900">{deepAnalysis.expenses.total}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Net Gain/Loss</p>
                    <p className="text-2xl font-bold">{deepAnalysis.netGainLoss}</p>
                  </div>
                </section>

                <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-strong:text-emerald-700">
                  <Markdown>{deepAnalysis.narrativeReport}</Markdown>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {hasRequestedAnalysis ? "AI Financial Summary" : "Available Intelligence"}
                  </h4>
                  {!hasRequestedAnalysis && (
                    <button
                      onClick={hasApiKey && aiEnabled ? onGenerateAnalysis : onOpenSettings}
                      className="text-[10px] bg-emerald-600 text-white px-3 py-1 rounded-full font-bold hover:bg-emerald-700 transition-all"
                    >
                      {hasApiKey && aiEnabled ? "Generate Report" : "Enable AI"}
                    </button>
                  )}
                </div>

                {isAnalyzing ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-32 bg-slate-50 rounded-2xl"></div>
                  </div>
                ) : analysis ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                       <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">AI Recommendation</p>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed">{analysis.financialPerformance.assetsChange}</p>
                       </div>
                       <div className={`p-4 rounded-xl text-sm font-bold ${analysis.conclusion.toLowerCase().includes('positive') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                         {analysis.conclusion}
                       </div>
                    </div>
                    <div className="prose prose-slate prose-sm max-w-none">
                      <Markdown>{analysis.narrativeReport}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed px-6">
                      Select a plan and click 'Generate' to use Gemini AI for deep financial insights.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
