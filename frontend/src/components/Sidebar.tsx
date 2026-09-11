import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Copy,
  GitMerge,
  BookOpen,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  Cpu,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, badge: null },
    { name: 'Duplicate Engine', path: '/duplicates', icon: Copy, badge: 'AI' },
    { name: 'Harmonization', path: '/workbench', icon: GitMerge, badge: 'Workbench' },
    { name: 'NMC Registry', path: '/registry', icon: BookOpen, badge: null },
    { name: 'Catalog Upload', path: '/upload', icon: UploadCloud, badge: null },
    { name: 'Analytics & Heatmap', path: '/analytics', icon: BarChart3, badge: null },
    { name: 'Audit Trail', path: '/audit', icon: ShieldCheck, badge: 'Immutable' },
    { name: 'SAP/ERP Integration', path: '/settings', icon: Cpu, badge: 'REST' },
  ];

  return (
    <aside className="w-64 bg-[#102444] text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 font-extrabold text-slate-950 text-xl tracking-tighter">
          N
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight text-white font-mono">NUMM</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              GOV.IN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-tight">
            National Unified Material Master
          </p>
        </div>
      </div>

      {/* Tricolor decorative ribbon */}
      <div className="h-1 flex w-full">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* Active User CPSE Badge */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CPSE Affiliation</span>
          <span className="font-mono text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10">
            {user?.cpseCode || 'CENTRAL GOV'}
          </span>
        </div>
        <p className="font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
        <span className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-800 text-amber-400 border border-amber-400/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </aside>
  );
};
