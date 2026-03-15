import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, AreaChart, Area
} from 'recharts';
import { PlanData } from '../types';
import { TrendingUp, Users, DollarSign, PieChart, FileText, ExternalLink, MapPin, Building2, Activity, Globe } from 'lucide-react';
import { FilingModel } from '../models/FilingModel';

interface DashboardProps {
  selectedPlan: PlanData | null;
  allPlans: PlanData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedPlan, allPlans }) => {
  // Global stats when no plan is selected
  const globalStats = useMemo(() => {
    const totalAssets = allPlans.reduce((sum, p) => sum + p.assets, 0);
    const totalParticipants = allPlans.reduce((sum, p) => sum + p.participantsEoy, 0);
    const avgGrowth = allPlans.length > 0
      ? allPlans.reduce((sum, p) => sum + (((p.assets - p.assetsBoy) / (p.assetsBoy || 1)) * 100), 0) / allPlans.length
      : 0;

    // Group by year for global trend
    const yearGroups = allPlans.reduce((acc: any, p) => {
      if (!acc[p.planYear]) acc[p.planYear] = { assets: 0, participants: 0, count: 0 };
      acc[p.planYear].assets += p.assets;
      acc[p.planYear].participants += p.participantsEoy;
      acc[p.planYear].count += 1;
      return acc;
    }, {});

    const globalTrend = Object.keys(yearGroups).sort().map(year => ({
      year,
      assets: yearGroups[year].assets,
      participants: yearGroups[year].participants,
      avgAssets: yearGroups[year].assets / yearGroups[year].count
    }));

    return { totalAssets, totalParticipants, avgGrowth, globalTrend };
  }, [allPlans]);

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

  if (!selectedPlan && allPlans.length === 0) return (
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
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Market Overview</h1>
            <p className="text-sm text-slate-500 font-medium">Summary of all filings in current view</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <Activity className="w-3.5 h-3.5" />
            {allPlans.length} Total Filings
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
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Aggregated Market Trend</h3>
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
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 flex gap-3">
           <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Plan Year</p>
              <span className="text-2xl font-black text-emerald-600">{selectedPlan.planYear}</span>
           </div>
        </div>

        <div className="flex items-start gap-6 max-w-3xl">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-200 shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{selectedPlan.planName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
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
