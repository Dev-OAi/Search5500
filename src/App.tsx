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

export default function App() {
  const [localFilings, setLocalFilings] = useState<PlanData[]>(FILINGS_DATA);

  const lastUpdated = useMemo(() => {
    // @ts-ignore
    import.meta.hot; // dummy to trigger re-render if needed in dev
    const dateStr = (FILINGS_DATA as any).lastUpdated;
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [zipFilter, setZipFilter] = useState("33432");
  const [yearFilter, setYearFilter] = useState("");
  
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [showDeepAnalysisInput, setShowDeepAnalysisInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "dashboard">("analysis");
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => localStorage.getItem("ai_enabled") === "true");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => localStorage.getItem("ai_enabled") === "true");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => localStorage.getItem("ai_enabled") === "true");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
  }, []);

  const saveAiSettings = (key: string, enabled: boolean) => {
    setApiKey(key);
    setAiEnabled(enabled);
    localStorage.setItem("gemini_api_key", key);
    localStorage.setItem("ai_enabled", enabled.toString());
    setShowKeyInput(false);
  };

  const filteredFilings = useMemo(() => {
    return localFilings.filter(
      (f) => {
        const matchesSearch = 
          f.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.ein.includes(searchTerm);
        
        const matchesZip = zipFilter ? f.zip.includes(zipFilter) : true;
        const matchesYear = yearFilter ? f.planYear === yearFilter : true;
        
        return matchesSearch && matchesZip && matchesYear;
      }
    );
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
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Dashboard selectedPlan={selectedPlan} allPlans={filteredFilings} />
              </motion.div>
            ) : (
              <motion.div
                key="filings-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-5xl mx-auto space-y-4"
              >
                {filteredFilings.map((plan) => (
                  <button
                    key={plan.ackId}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full text-left p-6 rounded-3xl border transition-all ${
                      selectedPlan?.ackId === plan.ackId
                        ? "bg-white border-emerald-500 shadow-xl ring-1 ring-emerald-500"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">EIN: {plan.ein}</span>
                         <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                            {plan.planYear} Filing
                         </span>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${selectedPlan?.ackId === plan.ackId ? "rotate-90 text-emerald-500" : "text-slate-300"}`} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{plan.planName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{plan.sponsorName}</p>
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Net Assets</p>
                          <p className="text-sm font-bold text-slate-700">${(plan.assets / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Participants</p>
                          <p className="text-sm font-bold text-slate-700">{plan.participantsEoy.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredFilings.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No filings found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
                    onClick={() => {
                      saveAiSettings("", false);
                    }}
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
