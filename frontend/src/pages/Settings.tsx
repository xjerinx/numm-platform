import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Key,
  Webhook,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../api/client';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';

export const Settings: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyCpse, setNewKeyCpse] = useState('ONGC');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');

  const { addToast } = useSocketStore();
  const { user } = useAuthStore();

  const fetchData = async () => {
    try {
      if (user?.role === 'SUPER_ADMIN') {
        const keyRes = await apiClient.get('/integrations/keys');
        setKeys(keyRes.data.keys || []);
      }
      const whRes = await apiClient.get('/integrations/webhooks');
      setWebhooks(whRes.data.webhooks || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      await apiClient.post('/integrations/keys', {
        name: newKeyName,
        cpseCode: newKeyCpse,
      });
      addToast('API Key Created', 'New connector key generated', 'success');
      setNewKeyName('');
      fetchData();
    } catch {
      addToast('Error', 'Failed to generate key', 'warning');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await apiClient.patch(`/integrations/keys/${id}/revoke`);
      addToast('API Key Revoked', 'Key deactivated immediately', 'info');
      fetchData();
    } catch {
      addToast('Error', 'Failed to revoke key', 'warning');
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) return;
    try {
      await apiClient.post('/integrations/webhooks', {
        url: newWebhookUrl,
        events: 'nmc.created,nmc.updated,duplicate.resolved',
      });
      addToast('Webhook Registered', 'Push notifications enabled', 'success');
      setNewWebhookUrl('');
      fetchData();
    } catch {
      addToast('Error', 'Failed to configure webhook', 'warning');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await apiClient.delete(`/integrations/webhooks/${id}`);
      addToast('Webhook Removed', 'Webhook unregistered', 'info');
      fetchData();
    } catch {
      addToast('Error', 'Failed to delete webhook', 'warning');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await apiClient.post(`/integrations/webhooks/${id}/test`);
      addToast('Webhook Ping Verified', `HTTP ${res.data.statusCode} in ${res.data.latencyMs}ms`, 'success');
    } catch {
      addToast('Ping Failed', 'Remote endpoint did not respond with 200 OK', 'warning');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const curlSample = `curl -X GET "http://localhost:4000/api/registry" \\
  -H "Authorization: Bearer numm_live_ongc_demo_key" \\
  -H "Accept: application/json"`;

  const pythonSample = `import requests

url = "http://localhost:4000/api/registry"
headers = {
    "Authorization": "Bearer numm_live_ongc_demo_key"
}
response = requests.get(url, headers=headers)
print(response.json())`;

  const nodeSample = `const axios = require('axios');

async function syncNmcRegistry() {
  const { data } = await axios.get('http://localhost:4000/api/registry', {
    headers: { Authorization: 'Bearer numm_live_ongc_demo_key' }
  });
  console.log('Synchronized NMCs:', data.data);
}
syncNmcRegistry();`;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-numm-navy" />
          <span>SAP / ERP Integration Gateway</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Synchronize National Material Codes (NMCs) with enterprise ERP systems (SAP S/4HANA, Oracle ERP Cloud) via secure REST endpoints and webhooks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'keys'
              ? 'border-amber-500 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          REST API Keys
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'webhooks'
              ? 'border-amber-500 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Webhook Dispatcher
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'docs'
              ? 'border-amber-500 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Developer API Docs & Code Samples
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Create Key Form (Admin only) */}
          {user?.role === 'SUPER_ADMIN' ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Generate Production ERP Connector Key</span>
              </h3>
              <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Key Label (e.g., SAIL Bokaro SAP Connector)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={newKeyCpse}
                    onChange={(e) => setNewKeyCpse(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 outline-none"
                  >
                    {['ONGC', 'BHEL', 'SAIL', 'GAIL', 'IOCL', 'NTPC', 'NMDC', 'HAL', 'BEL', 'CONCOR'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Issue API Key
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 shrink-0" />
              <span>API key generation is restricted to <strong>SUPER_ADMIN</strong>. You are logged in as {user?.role}.</span>
            </div>
          )}

          {/* Keys Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active ERP Keys</span>
              <span className="text-xs text-slate-400 font-mono">{keys.length} Registered</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans font-semibold">
                  <tr>
                    <th className="p-3">Label</th>
                    <th className="p-3">CPSE</th>
                    <th className="p-3">API Secret Key</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Synced</th>
                    <th className="p-3 text-right font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="p-3 font-sans font-bold text-slate-900">{k.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                          {k.cpseCode || 'CENTRAL'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">
                        <span className="font-mono text-slate-400">•••••••••••••••{k.key.slice(-8)}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            k.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleTimeString() : 'Never'}
                      </td>
                      <td className="p-3 text-right font-sans">
                        {k.status === 'ACTIVE' && user?.role === 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-amber-500" />
              <span>Register Real-time Webhook Receiver</span>
            </h3>
            <form onSubmit={handleCreateWebhook} className="flex gap-3">
              <input
                type="url"
                required
                placeholder="https://erp.cpse.gov.in/webhooks/numm-sync"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Webhook
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Receivers</span>
              <span className="text-xs text-slate-400 font-mono">{webhooks.length} Active</span>
            </div>
            <div className="divide-y divide-slate-100">
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-mono font-bold text-slate-900">{wh.url}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Subscribed Events: <span className="text-amber-700">{wh.events}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestWebhook(wh.id)}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" /> Test Ping
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API DOCS & CODE SAMPLES */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-numm-navy" />
                  <span>Integration Code Snippets</span>
                </h3>
                <p className="text-xs text-slate-400">Ready-to-use client requests for SAP and ERP backend services.</p>
              </div>
              <a
                href={`${apiClient.defaults.baseURL}/integrations/openapi.json`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                <span>OpenAPI / Swagger Spec</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Curl Sample */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>cURL</span>
                <button
                  onClick={() => copyToClipboard(curlSample, 'curl')}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedIndex === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'curl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl text-xs font-mono overflow-x-auto">
                {curlSample}
              </pre>
            </div>

            {/* Python Sample */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Python (requests)</span>
                <button
                  onClick={() => copyToClipboard(pythonSample, 'python')}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedIndex === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'python' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto">
                {pythonSample}
              </pre>
            </div>

            {/* Node.js Sample */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Node.js (Axios)</span>
                <button
                  onClick={() => copyToClipboard(nodeSample, 'node')}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedIndex === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'node' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-blue-300 rounded-xl text-xs font-mono overflow-x-auto">
                {nodeSample}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
