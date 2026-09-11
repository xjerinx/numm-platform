import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore, Role } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import apiClient from '../api/client';

interface TopBarProps {
  isAiOnline: boolean;
  onRefreshAiStatus?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isAiOnline, onRefreshAiStatus }) => {
  const { user, quickSwitchRole } = useAuthStore();
  const { activeJob, toasts } = useSocketStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles = [
    { role: 'SUPER_ADMIN' as Role, email: 'admin@numm.gov.in', label: 'Super Admin (All CPSEs)', cpse: null },
    { role: 'CPSE_ANALYST' as Role, email: 'analyst@ongc.in', label: 'CPSE Analyst (ONGC)', cpse: 'ONGC' },
    { role: 'REVIEWER' as Role, email: 'reviewer@numm.gov.in', label: 'National Reviewer (NMC Approver)', cpse: null },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
      {/* Left: Initiative Title & Search Trigger */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>One Nation – One Material Code</span>
            <span className="text-[11px] font-mono font-bold text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">CPSE Material Master Harmonization</span>
          </h1>
        </div>

        {/* Global search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs text-slate-500 font-medium transition border border-slate-200/60"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick actions & search</span>
          <kbd className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-500 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: AI Engine Status, Role Switcher, Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time AI Job Indicator */}
        {activeJob && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span className="font-semibold">{activeJob.message} ({activeJob.percent}%)</span>
          </div>
        )}

        {/* AI Service Online/Offline pill */}
        <div
          onClick={onRefreshAiStatus}
          title="Click to re-check AI microservice status"
          className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
            isAiOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isAiOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
          <span>{isAiOnline ? 'AI Engine Live' : 'AI Offline (Heuristic Mode)'}</span>
          <RefreshCw className="w-2.5 h-2.5 opacity-60 ml-0.5" />
        </div>

        {/* CPSE Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{user?.cpseCode || 'CENTRAL / ALL CPSEs'}</span>
        </div>

        {/* Quick Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-mono text-numm-navy font-bold">
              {user?.role === 'SUPER_ADMIN' ? 'Admin' : user?.role === 'CPSE_ANALYST' ? 'Analyst' : 'Reviewer'}
            </span>
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Role for Evaluation
              </div>
              {roles.map((r) => (
                <button
                  key={r.email}
                  onClick={() => {
                    quickSwitchRole(r.role, r.email, r.cpse);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                    user?.email === r.email ? 'font-bold text-amber-700 bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-[10px] text-slate-400">{r.email}</p>
                  </div>
                  {user?.email === r.email && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer">
          <Bell className="w-4 h-4" />
          {toasts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </div>
      </div>
    </header>
  );
};
