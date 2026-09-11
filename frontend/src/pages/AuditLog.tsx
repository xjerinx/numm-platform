import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  Clock,
  User,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import apiClient from '../api/client';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [activeDiff, setActiveDiff] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit', {
        params: {
          search: search || undefined,
          entity: selectedEntity !== 'ALL' ? selectedEntity : undefined,
          limit: 100,
        },
      });
      setLogs(res.data.data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, selectedEntity]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>National Audit Trail & Governance</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Append-Only
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all catalogue uploads, AI duplicate resolutions, reviewer actions, and NMC issuances.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 w-full">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by user, action, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Entities</option>
            <option value="HarmonizedMaterial">HarmonizedMaterial</option>
            <option value="DuplicatePair">DuplicatePair</option>
            <option value="Material">Material</option>
            <option value="ApiKey">ApiKey</option>
            <option value="Platform">Platform</option>
          </select>
        </div>
      </div>

      {/* Immutable Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Actor / User ID</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 font-mono text-[11px]">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 truncate max-w-[150px]">
                      {log.userId}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-amber-700 font-bold">{log.entity}</td>
                    <td className="p-3 text-slate-600 truncate max-w-[140px]">{log.entityId}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveDiff(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Diff Modal */}
      {activeDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Audit Record: {activeDiff.action}</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {activeDiff.id} • {new Date(activeDiff.createdAt).toUTCString()}
                </p>
              </div>
              <button
                onClick={() => setActiveDiff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">
                  Previous State (Old Value)
                </span>
                <pre className="p-3 rounded-xl bg-red-50/50 border border-red-100 text-red-950 overflow-x-auto">
                  {typeof activeDiff.oldValueParsed === 'object'
                    ? JSON.stringify(activeDiff.oldValueParsed, null, 2)
                    : activeDiff.oldValue || 'null (Initial Creation)'}
                </pre>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">
                  Committed State (New Value)
                </span>
                <pre className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-950 overflow-x-auto">
                  {typeof activeDiff.newValueParsed === 'object'
                    ? JSON.stringify(activeDiff.newValueParsed, null, 2)
                    : activeDiff.newValue || 'null'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveDiff(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
