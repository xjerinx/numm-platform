import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronRight,
  Database,
} from 'lucide-react';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';

export const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    materialNumber: '',
    localDescription: '',
    localClassCode: '',
    uom: '',
    status: '',
    cpseCode: '',
  });
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useSocketStore();
  const { user } = useAuthStore();

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/upload/history');
      setHistory(res.data.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      addToast('Invalid File Type', 'Please upload a valid CSV catalog file', 'warning');
      return;
    }
    setFile(selectedFile);
    setParsing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await apiClient.post('/upload/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(res.data);
      if (res.data.suggestedMapping) {
        setColumnMapping(res.data.suggestedMapping);
      }
      addToast('CSV Parsed', `Preview ready for ${res.data.totalRows} items`, 'info');
    } catch (err: any) {
      addToast('Upload Error', err.response?.data?.message || 'Failed to read CSV', 'warning');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData?.sessionId) return;
    setUploading(true);

    try {
      const res = await apiClient.post('/upload/confirm', {
        sessionId: previewData.sessionId,
        columnMapping,
        cpseCodeFallback: user?.cpseCode || 'ONGC',
      });

      addToast('Import Successful', res.data.message, 'success');
      setFile(null);
      setPreviewData(null);
      fetchHistory();
    } catch (err: any) {
      addToast('Import Failed', err.response?.data?.message || 'Could not commit items', 'warning');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Material Master Catalog Upload</h2>
        <p className="text-xs text-slate-500 mt-1">
          Ingest raw CPSE ERP catalog exports into the national staging repository for AI classification.
        </p>
      </div>

      {/* Upload Box */}
      {!previewData ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition cursor-pointer flex flex-col items-center justify-center ${
            dragOver ? 'border-amber-500 bg-amber-50/40' : 'border-slate-300 hover:border-slate-400 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {parsing ? 'Parsing CSV structure...' : 'Click to select or drag and drop CPSE catalog CSV'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Expected columns: Material_Number, Local_Description, Local_Class_Code, UOM, Status, CPSE_Code. Max size 25MB.
          </p>
        </div>
      ) : (
        /* Preview & Column Mapper Step */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> CSV Parsed: {previewData.filename}
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  Total Records: <span className="font-mono text-amber-600">{previewData.totalRows}</span> materials
                </p>
              </div>

              <button
                onClick={() => { setFile(null); setPreviewData(null); }}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Upload different file
              </button>
            </div>

            {/* Column Mapper Grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Map CSV Columns to Schema Fields
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'materialNumber', label: 'Material Number (Required)', required: true },
                  { key: 'localDescription', label: 'Local Description (Required)', required: true },
                  { key: 'localClassCode', label: 'Local Class Code', required: false },
                  { key: 'uom', label: 'Unit of Measure (UOM)', required: false },
                  { key: 'status', label: 'Item Status', required: false },
                  { key: 'cpseCode', label: 'CPSE Code', required: false },
                ].map((field) => (
                  <div key={field.key} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Ignore / Auto-assign --</option>
                      {previewData.headers?.map((h: string) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 10-row preview table */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Preview (First 10 Rows)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      {previewData.headers?.map((h: string) => (
                        <th key={h} className="p-2.5 font-mono whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                    {previewData.preview?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {previewData.headers?.map((h: string) => (
                          <td key={h} className="p-2.5 whitespace-nowrap max-w-xs truncate">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commit Action */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting Materials...
                  </>
                ) : (
                  <>
                    <span>Confirm & Ingest {previewData.totalRows} Items</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Upload History & Audit Log</span>
          </h3>
          <button
            onClick={fetchHistory}
            className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Filename</th>
                <th className="p-3">CPSE Target</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Status</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 font-mono">
                  <td className="p-3 font-bold text-slate-900">{item.id}</td>
                  <td className="p-3">{item.filename}</td>
                  <td className="p-3 font-bold text-amber-600">{item.cpseCode}</td>
                  <td className="p-3">{item.totalRows}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Done'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Processing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{item.uploadedBy}</td>
                  <td className="p-3 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
