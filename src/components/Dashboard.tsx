import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, AreaChart, Area
} from 'recharts';
import { PlanData } from '../types';
import { TrendingUp, Users, DollarSign, PieChart, FileText, ExternalLink, MapPin, Building2, Activity, Globe, RotateCcw, Calendar, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FilingModel } from '../models/FilingModel';

interface DashboardProps {
  selectedPlan: PlanData | null;
  allPlans: PlanData[]; // Full database for history/trends
  filteredPlans: PlanData[]; // Filtered set for Market Overview
  onSelectYear: (plan: PlanData) => void;
  onClearFilters: () => void;
  trendRangeType: '1y' | '3y' | '5y' | 'all' | 'custom';
  setTrendRangeType: (type: '1y' | '3y' | '5y' | 'all' | 'custom') => void;
  trendStartDate: string;
  setTrendStartDate: (date: string) => void;
  trendEndDate: string;
  setTrendEndDate: (date: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedPlan,
  allPlans,
  filteredPlans,
  onSelectYear,
  onClearFilters,
  trendRangeType,
  setTrendRangeType,
  trendStartDate,
  setTrendStartDate,
  trendEndDate,
  setTrendEndDate
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Global stats when no plan is selected
  const globalStats = useMemo(() => {
    const totalAssets = filteredPlans.reduce((sum, p) => sum + p.assets, 0);
    const totalParticipants = filteredPlans.reduce((sum, p) => sum + p.participantsEoy, 0);
    const avgGrowth = filteredPlans.length > 0
      ? filteredPlans.reduce((sum, p) => sum + (((p.assets - p.assetsBoy) / (p.assetsBoy || 1)) * 100), 0) / filteredPlans.length
      : 0;

    // Group by year for global trend
    const yearGroups = filteredPlans.reduce((acc: any, p) => {
      if (!acc[p.planYear]) acc[p.planYear] = { assets: 0, participants: 0, count: 0 };
      acc[p.planYear].assets += p.assets;
      acc[p.planYear].participants += p.participantsEoy;
      acc[p.planYear].count += 1;
      return acc;
    }, {});

    const allYears = Object.keys(yearGroups).sort();
    let filteredYears = allYears;

    if (trendRangeType === '1y' && allYears.length > 0) {
      filteredYears = [allYears[allYears.length - 1]];
    } else if (trendRangeType === '3y' && allYears.length > 0) {
      filteredYears = allYears.slice(-3);
    } else if (trendRangeType === '5y' && allYears.length > 0) {
      filteredYears = allYears.slice(-5);
    } else if (trendRangeType === 'custom') {
      filteredYears = allYears.filter(y => y >= trendStartDate && y <= trendEndDate);
    }

    const globalTrend = filteredYears.map(year => ({
      year,
      assets: yearGroups[year].assets,
      participants: yearGroups[year].participants,
      avgAssets: yearGroups[year].assets / yearGroups[year].count
    }));

    return { totalAssets, totalParticipants, avgGrowth, globalTrend };
  }, [filteredPlans]);

  // Data for trend charts (same EIN and PN, different years)
  const trendData = useMemo(() => {
    if (!selectedPlan) return [];
    return allPlans
      .filter(p => p.ein === selectedPlan.ein && p.pn === selectedPlan.pn)
      .sort((a, b) => parseInt(a.planYear) - parseInt(b.planYear))
      .map(p => {
        const model = new FilingModel(p);
        return {
          year: model.year.toString(),
          assets: model.assets,
          participants: model.participants,
          growth: model.assetGrowthRate.toFixed(1)
        };
      });
  }, [selectedPlan, allPlans]);

  // Data for comparison chart (top 5 plans by assets in current view)
  const comparisonData = useMemo(() => {
    return [...allPlans]
      .sort((a, b) => b.assets - a.assets)
      .slice(0, 5)
      .map(p => ({
        name: p.planName.length > 20 ? p.planName.substring(0, 20) + '...' : p.planName,
        assets: p.assets,
        fullName: p.planName
      }));
  }, [allPlans]);

  if (!selectedPlan && filteredPlans.length === 0) return (
    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
      <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900">No Data Available</h3>
      <p className="text-sm text-slate-500">Please upload a CSV or adjust your filters.</p>
    </div>
  );

  if (!selectedPlan) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Market Overview</h1>
              <p className="text-sm text-slate-500 font-medium">Summary of all filings in current view</p>
            </div>
            <button
              onClick={onClearFilters}
              className="mt-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full transition-all border border-emerald-100"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <Activity className="w-3.5 h-3.5" />
            {filteredPlans.length} Total Filings
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Net Assets</p>
            <p className="text-2xl font-bold text-slate-900">${(globalStats.totalAssets / 1000000000).toFixed(2)}B</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Participants</p>
            <p className="text-2xl font-bold text-slate-900">{globalStats.totalParticipants.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Avg. Asset Growth</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${globalStats.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {globalStats.avgGrowth.toFixed(1)}%
              </p>
              <TrendingUp className={`w-5 h-5 ${globalStats.avgGrowth >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Aggregated Market Trend</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(['1y', '3y', '5y', 'custom', 'all'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTrendRangeType(type)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      trendRangeType === type
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {type === '1y' ? '1 Year' :
                     type === '3y' ? '3 Year' :
                     type === '5y' ? '5 Year' :
                     type === 'all' ? 'All' : 'Custom'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`p-2 rounded-xl border transition-all ${
                    trendRangeType === 'custom' || showDatePicker
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-20"
                      >
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Custom Date Range</h4>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Start Year</label>
                            <select
                              value={trendStartDate}
                              onChange={(e) => { setTrendStartDate(e.target.value); setTrendRangeType('custom'); }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                              {Array.from({ length: 16 }, (_, i) => (2010 + i).toString()).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">End Year</label>
                            <select
                              value={trendEndDate}
                              onChange={(e) => { setTrendEndDate(e.target.value); setTrendRangeType('custom'); }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                              {Array.from({ length: 17 }, (_, i) => (2010 + i).toString()).reverse().map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors mt-2"
                          >
                            Apply Range
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalStats.globalTrend}>
                <defs>
                  <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                <Tooltip />
                <Area type="monotone" dataKey="assets" stroke="#059669" fillOpacity={1} fill="url(#colorAssets)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Plan Header Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-8 flex gap-3">
           <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Plan Year</p>
              <span className="text-xl md:text-2xl font-black text-emerald-600">{selectedPlan.planYear}</span>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-6 max-w-3xl">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-200 shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2 pr-16 md:pr-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight break-words">{selectedPlan.planName}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {selectedPlan.sponsorName}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedPlan.city}, {selectedPlan.state}</span>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">EIN / Plan No.</p>
                <p className="text-sm font-bold text-slate-700">{selectedPlan.ein} / {selectedPlan.pn}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Type</p>
                <p className="text-sm font-bold text-slate-700">{selectedPlan.planType || '401(k) Profit Sharing'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-50 pt-6">
          <a
            href={selectedPlan.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            View Official Filing PDF <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-slate-900">${(selectedPlan.assets / 1000000).toFixed(2)}M</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Participants</p>
          <p className="text-2xl font-bold text-slate-900">{selectedPlan.participantsEoy.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Asset Growth</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${selectedPlan.assets >= selectedPlan.assetsBoy ? 'text-emerald-600' : 'text-red-600'}`}>
              {(((selectedPlan.assets - selectedPlan.assetsBoy) / (selectedPlan.assetsBoy || 1)) * 100).toFixed(1)}%
            </p>
            <TrendingUp className={`w-5 h-5 ${selectedPlan.assets >= selectedPlan.assetsBoy ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Assets per Cap</p>
          <p className="text-2xl font-bold text-slate-900">${(selectedPlan.assets / (selectedPlan.participantsEoy || 1) / 1000).toFixed(1)}K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filing History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:col-span-2">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Filing History</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
              {trendData.length} Records Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assets</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participants</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allPlans
                  .filter(p => p.ein === selectedPlan.ein && p.pn === selectedPlan.pn)
                  .sort((a, b) => parseInt(b.planYear) - parseInt(a.planYear))
                  .map((p) => {
                    const model = new FilingModel(p);
                    const isCurrent = p.ackId === selectedPlan.ackId;
                    return (
                      <tr
                        key={p.ackId}
                        className={`group hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-emerald-50/30' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {p.planYear}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">${(p.assets / 1000000).toFixed(2)}M</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.participantsEoy.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${model.assetGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {model.assetGrowthRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            disabled={isCurrent}
                            onClick={() => onSelectYear(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            {isCurrent ? 'Viewing' : 'View Data'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Asset Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Financial Growth Trend</h3>
          </div>
          
          <div className="h-[250px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Assets']}
                  />
                  <Line type="monotone" dataKey="assets" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                <p>Add more years of data for this plan to see trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Participant Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Participant Engagement</h3>
          </div>
          
          <div className="h-[250px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="participants" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                <p>Insufficient data points for participant trend.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
