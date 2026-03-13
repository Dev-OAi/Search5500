import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { PlanData } from '../types';
import { TrendingUp, Users, DollarSign, PieChart } from 'lucide-react';

interface DashboardProps {
  selectedPlan: PlanData | null;
  allPlans: PlanData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedPlan, allPlans }) => {
  // Data for trend charts (same EIN, different years)
  const trendData = useMemo(() => {
    if (!selectedPlan) return [];
    return allPlans
      .filter(p => p.ein === selectedPlan.ein)
      .sort((a, b) => parseInt(a.planYear) - parseInt(b.planYear))
      .map(p => ({
        year: p.planYear,
        assets: p.assets,
        participants: p.participantsEoy,
        growth: (((p.assets - p.assetsBoy) / (p.assetsBoy || 1)) * 100).toFixed(1)
      }));
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

  if (!selectedPlan && allPlans.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Asset Growth Trend</h3>
          </div>
          
          <div className="h-[250px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Assets']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assets" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                <p>Add more years of data for {selectedPlan?.planName || 'this plan'} to see trends.</p>
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
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Participant Count</h3>
          </div>
          
          <div className="h-[250px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
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

      {/* Peer Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <PieChart className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Top Plans by Assets (Current View)</h3>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Assets']}
              />
              <Bar dataKey="assets" radius={[0, 4, 4, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedPlan && entry.fullName === selectedPlan.planName ? '#059669' : '#94a3b8'} 
                    fillOpacity={selectedPlan && entry.fullName === selectedPlan.planName ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
