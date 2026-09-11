import React, { useState, useEffect } from 'react';
import {
  Copy,
  Sliders,
  Filter,
  Download,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Building2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';

export const Duplicates: React.FC = () => {
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(60);
  const [selectedCpse, setSelectedCpse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { addToast } = useSocketStore();

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/duplicates', {
        params: {
          minSimilarity: threshold,
          cpse: selectedCpse,
          status: selectedStatus,
          limit: 100,
        },
      });
      setPairs(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [threshold, selectedCpse, selectedStatus]);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/duplicates/${id}`, { status });
      addToast('Status Updated', `Pair marked as ${status}`, status === 'APPROVED' ? 'success' : 'info');
      fetchDuplicates();
    } catch {
      addToast('Error', 'Failed to update pair status', 'warning');
    }
  };

  const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
    if (selectedIds.length === 0) return;
    try {
      await apiClient.post('/duplicates/bulk', { ids: selectedIds, action });
      addToast('Bulk Update', `Applied ${action} to ${selectedIds.length} items`, 'success');
      setSelectedIds([]);
      fetchDuplicates();
    } catch {
      addToast('Error', 'Bulk action failed', 'warning');
    }
  };

  const handleExportCsv = () => {
    window.open(`${apiClient.defaults.baseURL}/duplicates/export`, '_blank');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pairs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pairs.map((p) => p.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Cross-CPSE Duplicate Detection</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {pairs.length} Pairs
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AI-driven semantic clustering across CPSE material catalogs to identify duplicate procurement items.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDuplicates}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Similarity threshold slider */}
          <div className="sm:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Cosine Similarity Threshold</span>
              </span>
              <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* CPSE Filter */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">CPSE Filter</label>
            <select
              value={selectedCpse}
              onChange={(e) => setSelectedCpse(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All 10 CPSEs</option>
              {['ONGC', 'BHEL', 'SAIL', 'GAIL', 'IOCL', 'NTPC', 'NMDC', 'HAL', 'BEL', 'CONCOR'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pair Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-amber-50/60 p-3 rounded-xl">
            <span className="font-semibold text-amber-900">
              {selectedIds.length} candidate pair(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('APPROVE')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" /> Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('REJECT')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" /> Bulk Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={pairs.length > 0 && selectedIds.length === pairs.length}
                    onChange={toggleSelectAll}
                    className="rounded accent-amber-500"
                  />
                </th>
                <th className="p-3">CPSE A</th>
                <th className="p-3">Material A</th>
                <th className="p-3">CPSE B</th>
                <th className="p-3">Material B</th>
                <th className="p-3 text-center">Similarity</th>
                <th className="p-3">Suggested NMC</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Loading duplicate candidates...
                  </td>
                </tr>
              ) : pairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No duplicate pairs matching your threshold or filters.
                  </td>
                </tr>
              ) : (
                pairs.map((pair) => {
                  const isExpanded = expandedRowId === pair.id;
                  const isSelected = selectedIds.includes(pair.id);
                  const matA = pair.materialA;
                  const matB = pair.materialB;

                  return (
                    <React.Fragment key={pair.id}>
                      <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(pair.id)}
                            className="rounded accent-amber-500"
                          />
                        </td>
                        <td className="p-3 font-bold text-numm-navy">
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {matA?.cpseCode || 'ONGC'}
                          </span>
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <p className="font-mono font-bold text-slate-900">{matA?.materialNumber || '—'}</p>
                          <p className="truncate text-slate-500 text-[11px]">{matA?.localDescription || '—'}</p>
                        </td>
                        <td className="p-3 font-bold text-amber-800">
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                            {matB?.cpseCode || 'BHEL'}
                          </span>
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <p className="font-mono font-bold text-slate-900">{matB?.materialNumber || '—'}</p>
                          <p className="truncate text-slate-500 text-[11px]">{matB?.localDescription || '—'}</p>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>{Math.round(pair.similarity * 100)}%</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 text-[11px]">
                          {pair.suggestedNmc || 'NMC-PENDING'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pair.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pair.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pair.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedRowId(isExpanded ? null : pair.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                              title="Inspect Specs Side-by-Side"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {pair.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(pair.id, 'APPROVED')}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="Approve Duplicate"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(pair.id, 'REJECTED')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Side-by-Side Spec Comparison */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={9} className="p-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  Side-by-Side Specification Comparison
                                </span>
                                <span className="font-mono text-xs text-slate-500">
                                  Similarity Score: <strong>{pair.similarity}</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CPSE A Specs */}
                                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 space-y-1.5">
                                  <span className="text-[10px] font-bold text-blue-700 uppercase">
                                    Enterprise A: {matA?.cpseCode}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                                    {matA?.materialNumber}
                                  </h4>
                                  <p className="text-xs text-slate-700 font-medium">
                                    {matA?.localDescription}
                                  </p>
                                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                                    <span>Class: {matA?.localClassCode || 'N/A'}</span>
                                    <span>UOM: {matA?.uom || 'NOS'}</span>
                                    <span>Status: {matA?.status}</span>
                                  </div>
                                </div>

                                {/* CPSE B Specs */}
                                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 space-y-1.5">
                                  <span className="text-[10px] font-bold text-amber-700 uppercase">
                                    Enterprise B: {matB?.cpseCode}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                                    {matB?.materialNumber}
                                  </h4>
                                  <p className="text-xs text-slate-700 font-medium">
                                    {matB?.localDescription}
                                  </p>
                                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                                    <span>Class: {matB?.localClassCode || 'N/A'}</span>
                                    <span>UOM: {matB?.uom || 'NOS'}</span>
                                    <span>Status: {matB?.status}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
