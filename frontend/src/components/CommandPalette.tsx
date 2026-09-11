import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Upload,
  Copy,
  GitMerge,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketStore } from '../store/socketStore';
import apiClient from '../api/client';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { addToast } = useSocketStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { name: 'Dashboard Overview', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Duplicate Detection Engine', path: '/duplicates', icon: Copy, category: 'Harmonization' },
    { name: 'Material Harmonization Workbench', path: '/workbench', icon: GitMerge, category: 'Harmonization' },
    { name: 'National Material Code (NMC) Registry', path: '/registry', icon: BookOpen, category: 'Registry' },
    { name: 'CPSE Material Upload', path: '/upload', icon: Upload, category: 'Data Management' },
    { name: 'Analytics & Heatmap Reports', path: '/analytics', icon: BarChart3, category: 'Intelligence' },
    { name: 'Audit Trail & Compliance Log', path: '/audit', icon: ShieldCheck, category: 'Governance' },
    { name: 'SAP & ERP Integrations', path: '/settings', icon: Settings, category: 'Administration' },
  ];

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleRunAi = async () => {
    setIsOpen(false);
    try {
      addToast('Triggering AI Matching', 'Enqueued cross-CPSE deduplication job...', 'info');
      await apiClient.post('/materials/match-job');
    } catch {
      addToast('Error', 'Failed to trigger AI job', 'warning');
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, search modules, or navigate (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Action shortcut */}
          <div
            onClick={handleRunAi}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-900 cursor-pointer transition mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Run Cross-CPSE AI Matching</p>
                <p className="text-xs text-slate-500">Triggers async deduplication & UNSPSC clustering</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100/70 text-amber-800 rounded font-semibold">
              Action
            </span>
          </div>

          <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
            Modules & Views
          </div>

          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition text-slate-700 hover:text-slate-900 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">
              No matching modules found for "{query}"
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with arrows or click</span>
          <span>Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};
