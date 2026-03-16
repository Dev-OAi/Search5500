import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronRight, Upload, X, Database, Loader2, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Papa from "papaparse";
import { FILINGS_DATA } from "./data/filings";
import { PlanData, PlanAnalysis, DeepAnalysis } from "./types";
import { analyzePlan, deepAnalyzePlan } from "./services/geminiService";
import { performLocalAnalysis } from "./services/localAnalysisService";
import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { RightSidebar } from "./components/RightSidebar";
import { Header } from "./components/Header";
import { CompactFilingCard } from "./components/CompactFilingCard";
import { ListActionHeader } from "./components/ListActionHeader";

export default function App() {
  const [localFilings, setLocalFilings] = useState<PlanData[]>(FILINGS_DATA);

  // Consolidated Metadata logic
  const lastUpdated = useMemo(() => {
    const dateStr = (FILINGS_DATA as any).lastUpdated;
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
  }, []);

  // Filter & UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const availableZips = useMemo(() => {
    const zips = Array.from(new Set(localFilings.map(f => f.zip))).filter(Boolean).sort();
    return zips;
  }, [localFilings]);
  const [activeTab, setActiveTab] = useState<"analysis" | "dashboard">("analysis");
  const [sortBy, setSortBy] = useState<'year' | 'assets' | 'name'>('year');
  const [isGrouped, setIsGrouped] = useState(false);
  
  // Selection & Analysis State
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [showDeepAnalysisInput, setShowDeepAnalysisInput] = useState(false);
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = useState(false);

  // Settings & Navigation State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => localStorage.getItem("ai_enabled") === "true");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const [rightSidebarWidth, setRightSidebarWidth] = useState(480);
  const [listPaneWidth, setListPaneWidth] = useState(400);
  const [resizingRight, setResizingRight] = useState(false);
  const [resizingList, setResizingList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startResizingRight = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setResizingRight(true);
    e.preventDefault();
  }, []);

  const startResizingList = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setResizingList(true);
    e.preventDefault();
  }, []);

  const stopResizing = React.useCallback(() => {
    setResizingRight(false);
    setResizingList(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (resizingRight) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const newWidth = window.innerWidth - clientX;
        if (newWidth > 320 && newWidth < window.innerWidth * 0.8) {
          setRightSidebarWidth(newWidth);
        }
      } else if (resizingList) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        // The list pane starts after the left sidebar (64px = 256px if open)
        // Actually it's easier to use the mouse movement delta or just relative to window
        // But let's assume left sidebar is static 256px when open on desktop
        const sidebarWidth = isLeftSidebarOpen ? 256 : 0;
        const newWidth = clientX - sidebarWidth;
        if (newWidth > 280 && newWidth < window.innerWidth * 0.5) {
          setListPaneWidth(newWidth);
        }
      }
    },
    [resizingRight, resizingList, isLeftSidebarOpen]
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("touchmove", resize);
    window.addEventListener("touchend", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("touchmove", resize);
      window.removeEventListener("touchend", stopResizing);
    };
  }, [resize, stopResizing]);

  const saveAiSettings = (key: string, enabled: boolean) => {
    setApiKey(key);
    setAiEnabled(enabled);
    localStorage.setItem("gemini_api_key", key);
    localStorage.setItem("ai_enabled", enabled.toString());
    setShowKeyInput(false);
  };

  const processedFilings = useMemo(() => {
    let results = localFilings.filter((f) => {
      const matchesSearch =
        f.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ein.includes(searchTerm);

      const matchesZip = zipFilter ? f.zip.includes(zipFilter) : true;
      const matchesYear = yearFilter ? f.planYear === yearFilter : true;

      return matchesSearch && matchesZip && matchesYear;
    });

    // Apply sorting
    results.sort((a, b) => {
      if (sortBy === 'year') {
        return parseInt(b.planYear) - parseInt(a.planYear);
      } else if (sortBy === 'assets') {
        return b.assets - a.assets;
      } else if (sortBy === 'name') {
        return a.planName.localeCompare(b.planName);
      }
      return 0;
    });

    if (isGrouped) {
      // Group by EIN and PN (to distinguish different plans by same sponsor)
      const groups: { [key: string]: PlanData[] } = {};
      results.forEach(f => {
        const key = `${f.ein}-${f.pn}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });

      // Sort groups by the newest year of the top plan in each group
      const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        const topA = groups[a][0];
        const topB = groups[b][0];

        if (sortBy === 'year') {
          return parseInt(topB.planYear) - parseInt(topA.planYear);
        } else if (sortBy === 'assets') {
          return topB.assets - topA.assets;
        } else if (sortBy === 'name') {
          return topA.planName.localeCompare(topB.planName);
        }
        return 0;
      });

      return sortedGroupKeys.map(key => ({
        key,
        planName: groups[key][0].planName,
        ein: groups[key][0].ein,
        filings: groups[key]
      }));
    }

    return results;
  }, [localFilings, searchTerm, zipFilter, yearFilter, sortBy, isGrouped]);

  // Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, zipFilter, yearFilter, sortBy, isGrouped]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [processedFilings]);

  const filteredFilingsCount = useMemo(() => {
    return localFilings.filter((f) => {
      const matchesSearch =
        f.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ein.includes(searchTerm);
      const matchesZip = zipFilter ? f.zip.includes(zipFilter) : true;
      const matchesYear = yearFilter ? f.planYear === yearFilter : true;
      return matchesSearch && matchesZip && matchesYear;
    }).length;
  }, [localFilings, searchTerm, zipFilter, yearFilter]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData: PlanData[] = results.data
          .filter((row: any) => row["Ack ID"] || row["ackId"] || row["ACK_ID"])
          .map((row: any) => ({
            ackId: row["Ack ID"] || row["ackId"] || row["ACK_ID"] || "",
            ein: row["EIN"] || row["ein"] || row["SPONS_DFE_EIN"] || "",
            pn: row["PN"] || row["pn"] || row["PLAN_NUM"] || "",
            planName: row["Plan Name"] || row["planName"] || row["PLAN_NAME"] || "",
            sponsorName: row["Sponsor Name"] || row["sponsorName"] || row["SPONS_NAME"] || "",
            address: row["Address"] || row["address"] || "",
            city: row["City"] || row["city"] || "",
            state: row["State"] || row["state"] || "",
            zip: row["Zip"] || row["zip"] || row["SPONS_ZIP_CD"] || "",
            dateReceived: row["Date Received"] || row["dateReceived"] || "",
            planCodes: row["Plan Codes"] || row["planCodes"] || "",
            planType: row["Plan Type"] || row["planType"] || "",
            planYear: row["Plan Year"] || row["planYear"] || row["PLAN_YEAR"] || "",
            participants: parseInt(row["Participants"] || row["participants"] || row["TOT_PARTCP_CNT"] || "0"),
            participantsEoy: parseInt(row["Participants EOY"] || row["participantsEoy"] || row["TOT_PARTCP_CNT"] || row["RTRE_PLAN_PARTCP_CNT"] || "0"),
            assetsBoy: parseInt(row["Assets BOY"] || row["assetsBoy"] || row["TOT_ASSETS_BEG_AMT"] || row["NET_ASSETS_BEG_AMT"] || "0"),
            assets: parseInt(row["Assets"] || row["assets"] || row["TOT_ASSETS_END_AMT"] || row["NET_ASSETS_END_AMT"] || "0"),
            link: row["Link"] || row["link"] || "",
            totalIncome: parseInt(row["TOT_INCOME_AMT"] || "0"),
            totalExpenses: parseInt(row["TOT_EXPENSES_AMT"] || "0"),
            netIncome: parseInt(row["NET_INCOME_AMT"] || "0"),
            employerContributions: parseInt(row["EMPLOYER_CONTRB_AMT"] || "0"),
            participantContributions: parseInt(row["PARTCP_CONTRB_AMT"] || "0")
          }));
        
        if (parsedData.length === 0) {
          alert("No valid filing data found in CSV.");
          return;
        }

        setLocalFilings((prev) => {
          const combined = [...parsedData, ...prev];
          const seen = new Set();
          return combined.filter((item) => {
            const duplicate = seen.has(item.ackId);
            seen.add(item.ackId);
            return !duplicate;
          });
        });
      },
    });
  };

  const handleSelectPlan = async (plan: PlanData) => {
    setSelectedPlan(plan);
    setAnalysis(performLocalAnalysis(plan));
    setDeepAnalysis(null);
    setShowDeepAnalysisInput(false);
    setIsAnalyzing(false);
    setHasRequestedAnalysis(false);
    setIsRightSidebarOpen(true);
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedPlan || !apiKey || !aiEnabled) return;
    setIsAnalyzing(true);
    setHasRequestedAnalysis(true);
    const result = await analyzePlan(apiKey, selectedPlan.planName, selectedPlan.sponsorName, selectedPlan.planYear, selectedPlan.participantsEoy, selectedPlan.assets, selectedPlan.assetsBoy);
    if (result) setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleDeepAnalysis = async (text: string) => {
    if (!text.trim() || !apiKey || !aiEnabled) return;
    setIsDeepAnalyzing(true);
    const result = await deepAnalyzePlan(apiKey, text);
    if (result) setDeepAnalysis(result);
    setIsDeepAnalyzing(false);
  };

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        yearFilter={yearFilter}
        setYearFilter={setYearFilter}
        zipFilter={zipFilter}
        setZipFilter={setZipFilter}
        availableZips={availableZips}
        onOpenSettings={() => setShowKeyInput(true)}
        aiEnabled={aiEnabled}
        hasApiKey={!!apiKey}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onToggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onUploadClick={() => fileInputRef.current?.click()}
          lastUpdated={lastUpdated}
          selectedPlan={selectedPlan}
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isLeftSidebarOpen={isLeftSidebarOpen}
          isRightSidebarOpen={isRightSidebarOpen}
        />

        <main className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden relative">
          {/* Filings List Pane */}
          <section
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${listPaneWidth}px` : '100%' }}
            className={`
              flex-1 lg:flex-none flex flex-col bg-white border-r border-slate-200 transition-all min-h-0
              ${resizingList ? 'select-none transition-none' : ''}
              ${activeTab === 'dashboard' ? 'hidden lg:flex' : 'flex'}
            `}
          >
            <ListActionHeader
              sortBy={sortBy}
              setSortBy={setSortBy}
              isGrouped={isGrouped}
              setIsGrouped={setIsGrouped}
              yearFilter={yearFilter}
              setYearFilter={setYearFilter}
              zipFilter={zipFilter}
              setZipFilter={setZipFilter}
              availableZips={availableZips}
              totalResults={filteredFilingsCount}
            />

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isGrouped ? (
                (processedFilings as any[]).slice(0, visibleCount).map((group) => (
                  <div key={group.key} className="space-y-2">
                    <div className="px-2 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate mr-2">
                        {group.planName}
                      </h3>
                      <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded">
                        {group.ein}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {group.filings.map((plan: PlanData) => (
                        <CompactFilingCard
                          key={plan.ackId}
                          plan={plan}
                          isSelected={selectedPlan?.ackId === plan.ackId}
                          onSelect={handleSelectPlan}
                          hidePlanName={true}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                (processedFilings as PlanData[]).slice(0, visibleCount).map((plan) => (
                  <CompactFilingCard
                    key={plan.ackId}
                    plan={plan}
                    isSelected={selectedPlan?.ackId === plan.ackId}
                    onSelect={handleSelectPlan}
                  />
                ))
              )}

              {processedFilings.length > visibleCount && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              )}

              {filteredFilingsCount === 0 && (
                <div className="text-center py-12 px-4">
                  <Database className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">No filings match your criteria.</p>
                </div>
              )}
            </div>

            {/* List Resize Handle */}
            <div
              onMouseDown={startResizingList}
              onTouchStart={startResizingList}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors z-10 hidden lg:block"
            />
          </section>

          {/* Dashboard Pane */}
          <section className={`
            flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar
            ${activeTab === 'analysis' ? 'hidden lg:block' : 'block'}
          `}>
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              <Dashboard
                selectedPlan={selectedPlan}
                allPlans={localFilings}
                filteredPlans={localFilings.filter(f => {
                  const matchesSearch =
                    f.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.ein.includes(searchTerm);
                  const matchesZip = zipFilter ? f.zip.includes(zipFilter) : true;
                  const matchesYear = yearFilter ? f.planYear === yearFilter : true;
                  return matchesSearch && matchesZip && matchesYear;
                })}
                onSelectYear={handleSelectPlan}
              />
            </div>
          </section>
        </main>
      </div>

      <RightSidebar
        selectedPlan={selectedPlan}
        onClose={() => setIsRightSidebarOpen(false)}
        isOpen={isRightSidebarOpen}
        analysis={analysis}
        deepAnalysis={deepAnalysis}
        isAnalyzing={isAnalyzing}
        isDeepAnalyzing={isDeepAnalyzing}
        hasRequestedAnalysis={hasRequestedAnalysis}
        aiEnabled={aiEnabled}
        hasApiKey={!!apiKey}
        onGenerateAnalysis={handleGenerateAnalysis}
        onDeepAnalysis={handleDeepAnalysis}
        showDeepAnalysisInput={showDeepAnalysisInput}
        setShowDeepAnalysisInput={setShowDeepAnalysisInput}
        ocrText={ocrText}
        setOcrText={setOcrText}
        onOpenSettings={() => setShowKeyInput(true)}
        width={rightSidebarWidth}
        onResizeStart={startResizingRight}
        isResizing={resizingRight}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showKeyInput && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowKeyInput(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-600 p-2 rounded-xl">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">AI Analysis Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold">Enable AI Features</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Powered by Gemini</p>
                  </div>
                  <button
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <motion.div
                      animate={{ x: aiEnabled ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <div className={aiEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Paste your key here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    Advanced AI allows for **Deep Analysis** of PDF text. Your key is stored locally and never sent to our servers.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => saveAiSettings(apiKey, aiEnabled)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => saveAiSettings("", false)}
                    className="px-4 py-3 text-slate-500 text-sm font-medium hover:text-red-600 transition-colors"
                  >
                    Clear & Disable
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />
    </div>
  );
}
