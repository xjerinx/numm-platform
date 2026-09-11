import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Flame,
  Layers,
  Sparkles,
  Calculator,
  Printer,
} from 'lucide-react';
import apiClient from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Savings Estimator state
  const [annualSpend, setAnnualSpend] = useState(5000); // in ₹ Crores
  const [dedupRate, setDedupRate] = useState(12); // in %
  const [savingsResult, setSavingsResult] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/reports');
      setData(res.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const calculateSavings = async () => {
    try {
      const res = await apiClient.post('/analytics/savings-calc', {
        annualProcurementValueCr: annualSpend,
        deduplicationRatePct: dedupRate,
      });
      setSavingsResult(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    calculateSavings();
  }, [annualSpend, dedupRate]);

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Analytics & Intelligence...</div>;
  }

  const heatmap = data?.heatmap || [];
  const reductionData = data?.reductionData || [];
  const timeline = data?.timeline || [];
  const cpses = data?.cpses || [];
  const segments = data?.segments || [];

  // Helper function to color code heatmap cells
  const getHeatmapColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-600 text-white';
    if (pct >= 70) return 'bg-emerald-500 text-white';
    if (pct >= 55) return 'bg-amber-400 text-slate-900';
    if (pct >= 40) return 'bg-amber-200 text-slate-900';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-numm-navy" />
            <span>Harmonization Analytics & Strategic Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise mapping coverage, duplicate reduction velocity, and national procurement savings projections.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm print:hidden cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export PDF Report</span>
        </button>
      </div>

      {/* MODULE 1: COVERAGE HEATMAP (CPSEs × UNSPSC Segments) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Coverage Heatmap: CPSEs (Y) × UNSPSC Segments (X)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cell intensity signifies the percentage of materials mapped to standardized NMCs.
            </p>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">&lt;40%</span>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-slate-900">40-55%</span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-900">55-70%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white">70-85%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">85%+</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2.5 text-left text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200">
                  CPSE
                </th>
                {segments.map((seg: any) => (
                  <th
                    key={seg.code}
                    className="p-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 max-w-[140px] truncate"
                    title={`${seg.name} (${seg.code})`}
                  >
                    {seg.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cpses.map((cpse: string) => (
                <tr key={cpse}>
                  <td className="p-2.5 text-left text-xs font-mono font-bold text-numm-navy bg-slate-50/70 border border-slate-200">
                    {cpse}
                  </td>
                  {segments.map((seg: any) => {
                    const match = heatmap.find(
                      (h: any) => h.cpse === cpse && h.segmentCode === seg.code
                    );
                    const pct = match ? match.coveragePct : 30;
                    return (
                      <td
                        key={seg.code}
                        className={`p-2.5 text-xs font-mono font-bold border border-slate-200 transition-colors ${getHeatmapColor(
                          pct
                        )}`}
                      >
                        {pct}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODULE 2: DUPLICATE REDUCTION & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Duplicates Found vs Resolved */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Duplicate Reduction by CPSE</h3>
            <p className="text-xs text-slate-500">Candidate duplicates identified vs standardized into NMCs</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reductionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="cpse" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="duplicatesFound" name="Discovered" fill="#F4A014" radius={[4, 4, 0, 0]} />
                <Bar dataKey="duplicatesResolved" name="Resolved (NMC)" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Harmonization Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">National Harmonization Timeline</h3>
            <p className="text-xs text-slate-500">Cumulative materials brought under authoritative NMCs</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Harmonized"
                  stroke="#1B3A6B"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1B3A6B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MODULE 3: INTERACTIVE PROCUREMENT SAVINGS ESTIMATOR */}
      <div className="bg-gradient-to-br from-slate-900 via-[#102444] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold">National Procurement Savings Estimator</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate enterprise fiscal savings through catalog deduplication, bulk tender rationalization, and shared inventory.
            </p>
          </div>

          {savingsResult && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Projected Annual Fiscal Savings
              </span>
              <span className="font-mono text-3xl font-extrabold text-white">
                ₹{savingsResult.savingsBreakdown?.totalEstimatedSavingsCr?.toLocaleString()} Cr
              </span>
            </div>
          )}
        </div>

        {/* Input Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Annual Procurement Spend */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Annual CPSE Spend Pool</span>
              <span className="font-mono text-amber-400 font-bold">₹{annualSpend.toLocaleString()} Crores</span>
            </div>
            <input
              type="range"
              min="500"
              max="25000"
              step="500"
              value={annualSpend}
              onChange={(e) => setAnnualSpend(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Baseline expenditure across all CPSE operations</span>
          </div>

          {/* Deduplication Rate */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Projected Catalog Overlap Rate</span>
              <span className="font-mono text-amber-400 font-bold">{dedupRate}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              step="1"
              value={dedupRate}
              onChange={(e) => setDedupRate(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Average duplication factor across enterprise catalogs</span>
          </div>
        </div>

        {/* Savings Breakdown Cards */}
        {savingsResult && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Direct Price Rationalization (7%)</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                ₹{savingsResult.savingsBreakdown?.priceRationalizationCr} Cr
              </span>
              <span className="text-[10px] text-slate-500">Volume aggregation discount</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Inventory Holding Reduction (4%)</span>
              <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
                ₹{savingsResult.savingsBreakdown?.inventoryReductionCr} Cr
              </span>
              <span className="text-[10px] text-slate-500">Cross-enterprise spare sharing</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Administrative Efficiency (2%)</span>
              <span className="text-xl font-mono font-bold text-blue-400 mt-1 block">
                ₹{savingsResult.savingsBreakdown?.adminEfficiencyCr} Cr
              </span>
              <span className="text-[10px] text-slate-500">Reduced tender creation cycles</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
