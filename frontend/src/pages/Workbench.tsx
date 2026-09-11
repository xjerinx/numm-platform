import React, { useState, useEffect, useCallback } from 'react';
import {
  GitMerge,
  Sparkles,
  Check,
  X,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Building2,
  Tag,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';

export const Workbench: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(() => {
    return parseInt(localStorage.getItem('numm_workbench_index') || '0', 10);
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Suggested Standard Form Fields
  const [standardDesc, setStandardDesc] = useState('');
  const [unspscCode, setUnspscCode] = useState('');
  const [unspscName, setUnspscName] = useState('');
  const [standardUom, setStandardUom] = useState('');
  const [nmcCode, setNmcCode] = useState('');
  const [confidence, setConfidence] = useState(0.85);

  const { addToast } = useSocketStore();

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/harmonization/candidates?limit=50');
      setCandidates(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const currentItem = candidates[currentIndex] || null;

  // Fetch AI Suggestion for current material
  const fetchSuggestion = useCallback(async (matId: string) => {
    try {
      const res = await apiClient.get(`/harmonization/suggest/${matId}`);
      const s = res.data.suggestion;
      setStandardDesc(s.standardDescription);
      setUnspscCode(s.unspscCode);
      setUnspscName(s.unspscName);
      setStandardUom(s.standardUom);
      setNmcCode(s.suggestedNmc);
      setConfidence(s.confidenceScore);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (currentItem) {
      fetchSuggestion(currentItem.id);
      localStorage.setItem('numm_workbench_index', currentIndex.toString());
    }
  }, [currentIndex, currentItem, fetchSuggestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsEditing(false);
    } else {
      addToast('End of Queue', 'All pending candidates in this batch reviewed', 'info');
    }
  }, [currentIndex, candidates.length, addToast]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsEditing(false);
    }
  };

  const handleApprove = useCallback(async () => {
    if (!currentItem) return;
    try {
      await apiClient.post('/harmonization/approve', {
        materialId: currentItem.id,
        nmcCode,
        standardDescription: standardDesc,
        unspscCode,
        unspscName,
        uom: standardUom,
      });

      addToast('Harmonized & NMC Issued', `Material assigned ${nmcCode}`, 'success');
      handleNext();
    } catch {
      addToast('Error', 'Failed to approve harmonization', 'warning');
    }
  }, [currentItem, nmcCode, standardDesc, unspscCode, unspscName, standardUom, addToast, handleNext]);

  const handleReject = useCallback(async () => {
    if (!currentItem) return;
    try {
      await apiClient.post('/harmonization/reject', {
        materialId: currentItem.id,
        reason: 'Reviewer rejected standardization candidate',
      });

      addToast('Rejected', 'Material marked as obsolete', 'info');
      handleNext();
    } catch {
      addToast('Error', 'Failed to reject material', 'warning');
    }
  }, [currentItem, addToast, handleNext]);

  // Keyboard Shortcuts (A: Approve, R: Reject, E: Edit, N: Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReject();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApprove, handleReject, handleNext]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Harmonization Workbench...</div>;
  }

  if (!currentItem) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">Workbench Queue Clean!</h3>
        <p className="text-sm text-slate-500">
          All materials have been harmonized into approved National Material Codes (NMCs).
        </p>
        <button
          onClick={() => {
            localStorage.setItem('numm_workbench_index', '0');
            setCurrentIndex(0);
            fetchCandidates();
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Reset Workbench Queue
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitMerge className="w-6 h-6 text-numm-navy" />
            <span>Material Harmonization Workbench</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review raw CPSE descriptions, accept AI standardizations, and issue official NMCs.
          </p>
        </div>

        {/* Navigation & Position Memory */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 font-semibold">
            Item <strong className="text-slate-900">{currentIndex + 1}</strong> of {candidates.length}
          </span>
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white shadow-xs">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === candidates.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Banner */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
        <span className="font-bold text-slate-700">Keyboard Shortcuts:</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[10px]">A</kbd> Approve
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[10px]">R</kbd> Reject
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[10px]">E</kbd> Edit Mode
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[10px]">N</kbd> Next Item
        </span>
      </div>

      {/* Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT PANE: Raw CPSE Material */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Raw Enterprise Catalog Item
              </span>
              <span className="font-bold font-mono text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {currentItem.cpseCode}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Local Material Number</label>
                <p className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                  {currentItem.materialNumber}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Raw Local Description</label>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed mt-1">
                  {currentItem.localDescription}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Local Class</label>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {currentItem.localClassCode || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Local UOM</label>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {currentItem.uom || 'NOS'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                  <span className="text-xs font-semibold text-amber-700">
                    {currentItem.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Catalog ID: {currentItem.id.slice(0, 8)}...</span>
            <span>Origin: Legacy SAP ERP</span>
          </div>
        </div>

        {/* RIGHT PANE: Suggested Standard Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border-2 border-amber-500/30 shadow-md flex flex-col justify-between space-y-6 relative">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Suggested Standard Form
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Confidence: {Math.round(confidence * 100)}%
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-1.5 rounded-lg border transition ${
                    isEditing ? 'bg-amber-100 border-amber-300 text-amber-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Toggle Edit Mode (E)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* NMC Output */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Authoritative National Material Code (NMC)
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-xl font-extrabold text-numm-navy tracking-tight">
                    {nmcCode || 'NMC-GENERATING...'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                    ONE NATION STANDARD
                  </span>
                </div>
              </div>

              {/* Standardized Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Standardized Description (All-Caps, Normalized Specs)
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={standardDesc}
                    onChange={(e) => setStandardDesc(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-semibold text-slate-900">
                    {standardDesc || 'GENERATING STANDARDIZED DESCRIPTION...'}
                  </div>
                )}
              </div>

              {/* UNSPSC Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    UNSPSC Commodity Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={unspscCode}
                      onChange={(e) => setUnspscCode(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900">
                      {unspscCode}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    UNSPSC Commodity Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={unspscName}
                      onChange={(e) => setUnspscName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 truncate">
                      {unspscName}
                    </div>
                  )}
                </div>
              </div>

              {/* Standardized UOM */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Normalized Unit of Measure (UOM)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={standardUom}
                    onChange={(e) => setStandardUom(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-semibold text-slate-900">
                    {standardUom}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleReject}
              className="px-5 py-2.5 rounded-xl border border-red-300 hover:bg-red-50 text-red-700 font-bold text-xs flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" /> Reject (R)
            </button>

            <button
              onClick={handleApprove}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" /> Approve & Issue NMC (A)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
