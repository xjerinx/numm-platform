import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';

export const Registry: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNmc, setSelectedNmc] = useState<any | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const { addToast } = useSocketStore();

  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/registry', {
        params: { search: search || undefined, limit: 100 },
      });
      setRecords(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [search]);

  const handleExportCsv = () => {
    window.open(`${apiClient.defaults.baseURL}/registry/export`, '_blank');
  };

  const handleInspectNmc = async (nmcCode: string) => {
    setDrilldownLoading(true);
    try {
      const res = await apiClient.get(`/registry/${nmcCode}`);
      setSelectedNmc(res.data.data);
    } catch {
      addToast('Error', 'Failed to fetch NMC detail mappings', 'warning');
    } finally {
      setDrilldownLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-numm-navy" />
            <span>National Material Code (NMC) Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative national catalogue of harmonized materials across Central Public Sector Enterprises.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegistry}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by NMC Code, standard description, or UNSPSC commodity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
            Clear
          </button>
        )}
      </div>

      {/* Registry Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">NMC Code</th>
                <th className="p-3">Standard Description</th>
                <th className="p-3">UNSPSC</th>
                <th className="p-3">UOM</th>
                <th className="p-3">Mapped CPSEs</th>
                <th className="p-3">Approved Date</th>
                <th className="p-3">Approver</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading authoritative NMCs...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No approved NMC registrations found matching your query.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleInspectNmc(item.nmcCode)}
                    className="hover:bg-amber-50/40 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-bold text-numm-navy whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.nmcCode}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium max-w-sm text-slate-900 truncate">
                      {item.standardDescription}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <span className="font-bold text-slate-800">{item.unspscCode}</span>
                      <p className="text-[10px] text-slate-400 truncate">{item.unspscName}</p>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-600">{item.uom}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.mappedCpses?.map((cpse: string) => (
                          <span
                            key={cpse}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {cpse}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(item.approvedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-slate-500 truncate max-w-[120px]">{item.approvedBy}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectNmc(item.nmcCode);
                        }}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 ml-auto"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal for Mapped CPSE Codes */}
      {selectedNmc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-numm-navy">
                    {selectedNmc.nmcCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    APPROVED
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedNmc.standardDescription}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNmc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec breakdown */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">UNSPSC Code</span>
                <span className="font-mono font-bold text-slate-800">{selectedNmc.unspscCode}</span>
                <p className="text-[11px] text-slate-500 truncate">{selectedNmc.unspscName}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Normalized UOM</span>
                <span className="font-mono font-bold text-slate-800">{selectedNmc.uom}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved Date</span>
                <span className="font-mono text-slate-600">
                  {new Date(selectedNmc.approvedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Mapped CPSE Materials List */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Associated CPSE Local Material Codes</span>
                <span className="font-mono text-slate-400 font-medium">
                  {selectedNmc.mappings?.length || 0} Linked Items
                </span>
              </h5>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedNmc.mappings?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {m.cpseCode}
                      </span>
                      <span className="font-bold text-slate-900">{m.localMaterialNumber}</span>
                    </div>
                    {m.materialDetails && (
                      <p className="text-[11px] text-slate-500 font-sans truncate max-w-xs text-right">
                        {m.materialDetails.localDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNmc(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
