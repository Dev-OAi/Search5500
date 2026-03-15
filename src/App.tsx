import React, { useState, useMemo, useRef } from "react";
import { Search, FileText, BarChart2, ExternalLink, Loader2, ChevronRight, Info, Upload, X, FileUp, Database, AlertCircle, LayoutDashboard, PieChart, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Papa from "papaparse";
import Markdown from "react-markdown";
import { FILINGS_DATA } from "./data/filings";
import { PlanData, PlanAnalysis, DeepAnalysis } from "./types";
import { analyzePlan, deepAnalyzePlan } from "./services/geminiService";
import { performLocalAnalysis } from "./services/localAnalysisService";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [localFilings, setLocalFilings] = useState<PlanData[]>(FILINGS_DATA);
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
  const [showKeyInput, setShowKeyInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
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
          .filter((row: any) => row["Ack ID"] || row["ackId"])
          .map((row: any) => ({
            ackId: row["Ack ID"] || row["ackId"] || "",
            ein: row["EIN"] || row["ein"] || "",
            pn: row["PN"] || row["pn"] || "",
            planName: row["Plan Name"] || row["planName"] || "",
            sponsorName: row["Sponsor Name"] || row["sponsorName"] || "",
            address: row["Address"] || row["address"] || "",
            city: row["City"] || row["city"] || "",
            state: row["State"] || row["state"] || "",
            zip: row["Zip"] || row["zip"] || "",
            dateReceived: row["Date Received"] || row["dateReceived"] || "",
            planCodes: row["Plan Codes"] || row["planCodes"] || "",
            planType: row["Plan Type"] || row["planType"] || "",
            planYear: row["Plan Year"] || row["planYear"] || "",
            participants: parseInt(row["Participants"] || row["participants"] || row["Participants End of Year"] || "0"),
            participantsEoy: parseInt(row["Participants EOY"] || row["participantsEoy"] || row["Participants End of Year"] || "0"),
            assetsBoy: parseInt(row["Assets BOY"] || row["assetsBoy"] || row["Net Assets Beginning of Year"] || "0"),
            assets: parseInt(row["Assets"] || row["assets"] || row["Net Assets End of Year"] || "0"),
            link: row["Link"] || row["link"] || ""
          }));
        
        if (parsedData.length === 0) {
          alert("No valid filing data found in CSV. Please ensure it has the correct headers (e.g., 'Ack ID', 'Plan Name').");
          return;
        }

        setLocalFilings((prev) => [...parsedData, ...prev]);
        // Deduplicate by Ack ID
        setLocalFilings((prev) => {
          const seen = new Set();
          return prev.filter((item) => {
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
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedPlan || !apiKey) return;
    
    setIsAnalyzing(true);
    setHasRequestedAnalysis(true);
    
    const result = await analyzePlan(
      apiKey,
      selectedPlan.planName,
      selectedPlan.sponsorName,
      selectedPlan.planYear,
      selectedPlan.participantsEoy,
      selectedPlan.assets,
      selectedPlan.assetsBoy
    );
    
    if (result) {
      setAnalysis(result);
    }
    setIsAnalyzing(false);
  };

  const handleDeepAnalysis = async () => {
    if (!ocrText.trim() || !apiKey) return;
    setIsDeepAnalyzing(true);
    const result = await deepAnalyzePlan(apiKey, ocrText);
    setDeepAnalysis(result);
    setIsDeepAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block">Form 5500 Analyzer</h1>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search plan, sponsor, or EIN..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-24 hidden md:block">
              <input
                type="text"
                placeholder="Zip"
                className="w-full px-3 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-full transition-colors ${apiKey ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
              title="Settings"
            >
              <Database className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Upload CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* API Key Modal */}
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

              <div className="space-y-4">
                <div>
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
                    Enter your Google Gemini API key to enable advanced AI-powered summaries. Your key is stored locally in your browser and never sent to our servers.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => saveApiKey(apiKey)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Save Key
                  </button>
                  <button
                    onClick={() => {
                      saveApiKey("");
                    }}
                    className="px-4 py-3 text-slate-500 text-sm font-medium hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: List of Filings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Filings</h2>
            <div className="flex items-center gap-2">
               <select 
                 className="text-xs bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                 value={yearFilter}
                 onChange={(e) => setYearFilter(e.target.value)}
               >
                 <option value="">All Years</option>
                 <option value="2024">2024</option>
                 <option value="2023">2023</option>
                 <option value="2022">2022</option>
                 <option value="2021">2021</option>
                 <option value="2020">2020</option>
               </select>
               <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-medium">
                {filteredFilings.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
            {filteredFilings.map((plan) => (
              <motion.button
                key={plan.ackId}
                layout
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedPlan?.ackId === plan.ackId
                    ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500"
                    : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-slate-400">EIN: {plan.ein}</span>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {plan.planYear}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{plan.planName}</h3>
                <p className="text-xs text-slate-500 truncate">{plan.sponsorName}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <span>Assets: ${(plan.assets / 1000000).toFixed(2)}M</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedPlan?.ackId === plan.ackId ? "rotate-90" : ""}`} />
                </div>
              </motion.button>
            ))}
            {filteredFilings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 px-4">No filings found. Try adjusting your search or zip code.</p>
                <a 
                  href="https://www.efast.dol.gov/5500Search/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-600 font-medium hover:underline"
                >
                  Search on eFAST <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Analysis */}
        <div className="lg:col-span-8">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl mb-6 w-fit">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "analysis"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
          </div>

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
            ) : selectedPlan ? (
              <motion.div
                key={selectedPlan.ackId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Plan Header Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="relative flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                          {selectedPlan.planYear} Filing
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                          {selectedPlan.planType}
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                        {selectedPlan.planName}
                      </h2>
                      <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {selectedPlan.sponsorName}
                      </p>
                      <p className="text-slate-400 text-xs mt-1 ml-3.5">
                        {selectedPlan.city}, {selectedPlan.state} {selectedPlan.zip}
                      </p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                      <a
                        href={selectedPlan.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95 shrink-0"
                      >
                        View PDF <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setShowDeepAnalysisInput(!showDeepAnalysisInput)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 shrink-0"
                      >
                        <Database className="w-4 h-4" />
                        Deep Analysis
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pt-10 border-t border-slate-100 relative">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">EIN / PN</p>
                      <p className="text-base font-bold text-slate-800">{selectedPlan.ein} <span className="text-slate-300 font-light mx-1">/</span> {selectedPlan.pn}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Participants</p>
                      <p className="text-base font-bold text-slate-800">{selectedPlan.participantsEoy.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Net Assets</p>
                      <p className="text-base font-bold text-slate-800">${(selectedPlan.assets / 1000000).toFixed(2)}M</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Asset Growth</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-bold ${selectedPlan.assets >= selectedPlan.assetsBoy ? 'text-emerald-600' : 'text-red-600'}`}>
                          {(((selectedPlan.assets - selectedPlan.assetsBoy) / (selectedPlan.assetsBoy || 1)) * 100).toFixed(1)}%
                        </p>
                        <TrendingUp className={`w-4 h-4 ${selectedPlan.assets >= selectedPlan.assetsBoy ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
                      </div>
                    </div>
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
                      <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold flex items-center gap-2">
                            <FileUp className="w-4 h-4 text-emerald-600" />
                            PDF OCR Text Input
                          </h3>
                          <button onClick={() => setShowDeepAnalysisInput(false)}>
                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Paste the text content from the Form 5500 PDF for a comprehensive extraction and summary of financial details.
                        </p>
                        <textarea
                          className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="Paste OCR text here..."
                          value={ocrText}
                          onChange={(e) => setOcrText(e.target.value)}
                        />
                        <button
                          onClick={handleDeepAnalysis}
                          disabled={isDeepAnalyzing || !ocrText.trim()}
                          className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {isDeepAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                          Generate Deep Summary
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Deep Analysis Result */}
                {deepAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden"
                  >
                    <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        <h3 className="font-bold">Comprehensive Plan Summary</h3>
                      </div>
                      <span className="text-[10px] bg-emerald-500 px-2 py-1 rounded uppercase font-black tracking-tighter">Verified Extraction</span>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Plan Identity & Status</h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Plan Sponsor</p>
                              <p className="text-sm font-semibold">{deepAnalysis?.planSponsor || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Plan Type</p>
                              <p className="text-sm font-semibold">{deepAnalysis?.planType || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Participant Count</p>
                              <p className="text-sm font-semibold">
                                {deepAnalysis?.participantCount?.start ?? "N/A"} (Start) → {deepAnalysis?.participantCount?.end ?? "N/A"} (End)
                              </p>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Financial Performance</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Net Assets</p>
                                <p className="text-xs text-slate-500">{deepAnalysis?.totalNetAssets?.boy || "N/A"} (BOY)</p>
                              </div>
                              <p className="text-sm font-bold">{deepAnalysis?.totalNetAssets?.eoy || "N/A"} (EOY)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Income</p>
                                <p className="text-sm font-semibold">{deepAnalysis?.income?.total || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Employer Contrib.</p>
                                <p className="text-sm font-semibold">{deepAnalysis?.employerContributions || "N/A"}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                              <span className="text-xs font-bold text-slate-500 uppercase">Net Gain/Loss</span>
                              <span className={`text-sm font-black ${deepAnalysis?.netGainLoss?.includes('-') || deepAnalysis?.netGainLoss?.toLowerCase().includes('loss') ? 'text-red-600' : 'text-emerald-600'}`}>
                                {deepAnalysis?.netGainLoss || "N/A"}
                              </span>
                            </div>
                          </div>
                        </section>
                      </div>

                      <section className="bg-slate-900 text-slate-300 p-6 rounded-2xl">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Expenses & Distributions</h4>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Total Expenses</p>
                            <p className="text-lg font-bold text-white">{deepAnalysis?.expenses?.total || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Benefits Paid</p>
                            <p className="text-sm font-semibold text-white">{deepAnalysis?.expenses?.benefitsPaid || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Admin Fees</p>
                            <p className="text-sm font-semibold text-white">{deepAnalysis?.expenses?.adminFees || "N/A"}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Compliance & Protection</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Fidelity Bond</p>
                            <p className="text-xs font-semibold">{deepAnalysis?.compliance?.fidelityBond || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Participant Loans</p>
                            <p className="text-xs font-semibold">{deepAnalysis?.compliance?.participantLoans || "N/A"}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Operational Integrity</p>
                            <p className="text-xs font-semibold">{deepAnalysis?.compliance?.operationalIntegrity || "N/A"}</p>
                          </div>
                        </div>
                      </section>

                      <div className="pt-6 border-t border-slate-100">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                          <h4 className="text-emerald-800 font-black text-xs uppercase tracking-widest mb-3">Conclusion</h4>
                          <p className="text-emerald-900 leading-relaxed font-medium">{deepAnalysis?.conclusion || "No conclusion provided."}</p>
                        </div>
                      </div>

                      {deepAnalysis?.narrativeReport && (
                        <div className="pt-8 border-t border-slate-100">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Narrative Analysis</h4>
                          <div className="prose prose-slate max-w-none prose-sm prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:block prose-strong:mt-4 prose-strong:mb-2 prose-strong:text-sm">
                            <Markdown>{deepAnalysis.narrativeReport}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Standard AI Analysis Section (if deep analysis not present) */}
                {!deepAnalysis && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <BarChart2 className="w-5 h-5" />
                      <h3 className="font-semibold">
                        {hasRequestedAnalysis ? "AI Financial Summary" : "Local Financial Summary"}
                      </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAnalyzing && (
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing...
                          </div>
                        )}
                        {!hasRequestedAnalysis && !isAnalyzing && (
                          <button
                          onClick={apiKey ? handleGenerateAnalysis : () => setShowKeyInput(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                          >
                          {apiKey ? "Upgrade with AI" : "Add API Key for AI"}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {isAnalyzing ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                          <div className="h-24 bg-slate-50 rounded"></div>
                        </div>
                      ) : analysis ? (
                        <div className="space-y-8">
                          <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Identity & Status</h4>
                            <p className="text-slate-700 leading-relaxed">{analysis?.identity || "N/A"}</p>
                          </section>

                          <section className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Financial Performance</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Asset Change</span>
                                  <span className="font-semibold">{analysis?.financialPerformance?.assetsChange || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Total Income</span>
                                  <span className="font-semibold">{analysis?.financialPerformance?.income || "N/A"}</span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Employer Contrib.</span>
                                  <span className="font-semibold">{analysis?.financialPerformance?.employerContributions || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Net Income/Loss</span>
                                  <span className={`font-bold ${analysis?.financialPerformance?.netIncome?.includes('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {analysis?.financialPerformance?.netIncome || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </section>

                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                            <h4 className="text-emerald-800 font-bold text-xs uppercase tracking-widest mb-2">Conclusion</h4>
                            <p className="text-emerald-900 leading-relaxed">{analysis?.conclusion || "No conclusion provided."}</p>
                          </div>

                          {analysis?.narrativeReport && (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Narrative Summary</h4>
                              <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:block prose-strong:mt-4 prose-strong:mb-2 prose-strong:text-sm">
                                <Markdown>{analysis.narrativeReport}</Markdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : !hasRequestedAnalysis ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 font-medium">Analysis Ready</p>
                          <p className="text-xs text-slate-400 mt-1 mb-6">Click the button above to generate a professional summary of this filing.</p>
                          <button
                            onClick={apiKey ? handleGenerateAnalysis : () => setShowKeyInput(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                          >
                            {apiKey ? "Generate AI Summary" : "Upgrade with AI Summary"}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400">Analysis could not be generated for this plan.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Database className="w-12 h-12 text-slate-300" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Form 5500 Search & Analysis</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                  Upload a CSV from eFAST or search the local database to analyze retirement plan performance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Upload eFAST CSV
                  </button>
                  <a
                    href="https://www.efast.dol.gov/5500Search/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-full font-medium hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Go to eFAST Search
                  </a>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
