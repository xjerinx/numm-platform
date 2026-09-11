import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Percent,
  Copy,
  BookCheck,
  Building2,
  Sparkles,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

const CPSE_COLORS = [
  '#1B3A6B', '#F4A014', '#16A34A', '#2563EB', '#D97706',
  '#9333EA', '#059669', '#DC2626', '#0284C7', '#4F46E5'
];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringAi, setTriggeringAi] = useState(false);
  const { addToast, activeJob } = useSocketStore();

  const fetchDashboardData = async () => {
    try {
      const res = await apiClient.get('/analytics/dashboard');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunAiMatching = async () => {
    setTriggeringAi(true);
    try {
      addToast('AI Job Enqueued', 'Initiating cross-CPSE semantic duplicate detection...', 'info');
      await apiClient.post('/materials/match-job');
      // Refresh after small delay
      setTimeout(fetchDashboardData, 2000);
    } catch {
      addToast('Error', 'Failed to launch AI matching job', 'warning');
    } finally {
      setTriggeringAi(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalMaterials: 909,
    mappedMaterials: 5,
    mappedPercent: 0.6,
    duplicatePairsFound: 7,
    approvedNmcs: 5,
    cpsesOnboarded: 10,
  };

  const cpseCoverage = data?.cpseCoverage || [];
  const duplicateTrend = data?.duplicateTrend || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Call-to-Action */}
      <div className="bg-gradient-to-r from-[#1B3A6B] via-[#152e55] to-[#0f1f38] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950">
              NATIONAL INITIATIVE
            </span>
            <span className="text-xs text-slate-300 font-medium">Ministry of Heavy Industries & CPSEs</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            One Nation – One Material Code (NUMM)
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Unifying and harmonizing catalogs across 10 central enterprises into authoritative 
            National Material Codes (NMCs) to eliminate procurement redundancies.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            onClick={handleRunAiMatching}
            disabled={triggeringAi || !!activeJob}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 text-slate-950 ${triggeringAi || activeJob ? 'animate-spin' : ''}`} />
            <span>{triggeringAi || activeJob ? 'AI Matching Running...' : 'Run AI Matching'}</span>
          </button>
        </div>

        {/* Subtle decorative motif */}
        <div className="absolute right-0 -bottom-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 5 Animated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Materials"
          value={stats.totalMaterials}
          icon={Boxes}
          accentColor="text-blue-600"
          subtext="Catalog items across CPSEs"
          delay={0}
        />
        <StatCard
          title="Mapped to NMC"
          value={stats.mappedPercent}
          suffix="%"
          decimalPlaces={1}
          icon={Percent}
          accentColor="text-emerald-600"
          trend="+1.4% this week"
          trendPositive={true}
          delay={0.1}
        />
        <StatCard
          title="Duplicates Detected"
          value={stats.duplicatePairsFound}
          icon={Copy}
          accentColor="text-amber-600"
          subtext="Cross-CPSE candidate pairs"
          delay={0.2}
        />
        <StatCard
          title="Approved NMCs"
          value={stats.approvedNmcs}
          icon={BookCheck}
          accentColor="text-indigo-600"
          subtext="Authoritative national codes"
          delay={0.3}
        />
        <StatCard
          title="CPSEs Onboarded"
          value={stats.cpsesOnboarded}
          icon={Building2}
          accentColor="text-slate-800"
          subtext="All 10 active enterprises"
          delay={0.4}
        />
      </div>

      {/* Middle Row: Donut Chart & Trend Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapping Coverage Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">CPSE Catalog Share</h3>
              <p className="text-xs text-slate-500">Distribution of material records across enterprises</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              10 CPSEs
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cpseCoverage}
                  dataKey="total"
                  nameKey="cpse"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {cpseCoverage.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CPSE_COLORS[index % CPSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} items`, `CPSE: ${name}`]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-4 border-t border-slate-100 text-center">
            {cpseCoverage.slice(0, 5).map((c: any, i: number) => (
              <div key={c.cpse} className="p-1">
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CPSE_COLORS[i] }} />
                <span className="text-[11px] font-bold text-slate-700">{c.cpse}</span>
                <p className="text-[10px] text-slate-400 font-mono">{c.total}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Duplicate Detection Trend Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Duplicate Detection & Resolution Trend</h3>
              <p className="text-xs text-slate-500">Pairs discovered vs resolved into standardized NMCs</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Discovered
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={duplicateTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Line
                  type="monotone"
                  dataKey="found"
                  stroke="#F4A014"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F4A014' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#16A34A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#16A34A' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>High-confidence pairs grouped by UNSPSC class</span>
            <span className="font-semibold text-slate-700">Deduplication velocity: +34% MoM</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Activity Feed */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-numm-navy" />
            <h3 className="text-base font-bold text-slate-900">Live Platform Activity Feed</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time WebSocket event sync</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No recent activity logged yet.</p>
          ) : (
            recentActivity.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 mr-2">{log.action}</span>
                    <span className="text-slate-500 font-mono">[{log.entity}: {log.entityId}]</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
