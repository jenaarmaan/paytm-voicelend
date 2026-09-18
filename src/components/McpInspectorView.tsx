import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Share2,
  Database,
  ShieldCheck,
  FileCode2,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  GitFork,
  Radio,
  Copy,
  Check
} from 'lucide-react';
import { Merchant, MCPLogEntry, AuditRecord } from '../types.ts';
import { MCP_TOOLS_MANIFEST } from '../lib/mcp.ts';
import { MERCHANTS } from '../data/merchants.ts';
import { formatINR } from '../lib/finance.ts';

interface McpInspectorViewProps {
  selectedMerchant: Merchant;
  onSelectMerchant: (merchant: Merchant) => void;
}

export const McpInspectorView: React.FC<McpInspectorViewProps> = ({
  selectedMerchant,
  onSelectMerchant
}) => {
  const [activeTab, setActiveTab] = useState<'rpc' | 'tools' | 'graph' | 'biometrics' | 'audit'>('rpc');
  
  // Interactive Tool Playground State
  const [selectedTool, setSelectedTool] = useState<string>('voice_intent_parser');
  const [toolInputParams, setToolInputParams] = useState<string>(
    JSON.stringify({ transcript: 'Bhaiya 25,000 ka loan 3 mahine ke liye dedo maal bharna hai' }, null, 2)
  );
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [isCallingTool, setIsCallingTool] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Live RPC Logs
  const [logs, setLogs] = useState<MCPLogEntry[]>([
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      direction: 'INCOMING',
      endpoint: '/mcp/v1/rpc',
      tool: 'initialize',
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize', client: 'Paytm_SuperApp_Gateway_v4' },
      durationMs: 14,
      status: 'SUCCESS'
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 95000).toLocaleTimeString(),
      direction: 'OUTGOING',
      endpoint: '/mcp/v1/tools',
      tool: 'tools/list',
      payload: { toolsCount: 4, protocol: '2024-11-05' },
      durationMs: 8,
      status: 'SUCCESS'
    },
    {
      id: 'log_03',
      timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
      direction: 'INCOMING',
      endpoint: '/mcp/v1/rpc',
      tool: 'graph_credit_scorer',
      payload: { merchant_id: selectedMerchant.id, node_depth: 3 },
      durationMs: 22,
      status: 'SUCCESS'
    }
  ]);

  // Audit records
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);

  useEffect(() => {
    // Fetch live audit trail from server
    fetch('/api/v1/audit-trail')
      .then(res => res.json())
      .then(data => {
        if (data.auditLogs) setAuditRecords(data.auditLogs);
      })
      .catch(() => {});
  }, []);

  // Update sample inputs when switching tools
  const handleSelectTool = (toolName: string) => {
    setSelectedTool(toolName);
    setToolOutput(null);

    switch (toolName) {
      case 'voice_intent_parser':
        setToolInputParams(
          JSON.stringify({ transcript: 'Bhaiya 25,000 ka loan 3 mahine ke liye dedo maal bharna hai' }, null, 2)
        );
        break;
      case 'graph_credit_scorer':
        setToolInputParams(JSON.stringify({ merchant_id: selectedMerchant.id }, null, 2));
        break;
      case 'deterministic_underwriter':
        setToolInputParams(
          JSON.stringify({ merchant_id: selectedMerchant.id, requested_amount: 25000, tenure_months: 3 }, null, 2)
        );
        break;
      case 'voice_kfs_generator':
        setToolInputParams(
          JSON.stringify(
            { merchant_id: selectedMerchant.id, principal: 25000, tenure_months: 3, language: 'Hinglish' },
            null,
            2
          )
        );
        break;
    }
  };

  // Execute Tool Call via JSON-RPC
  const handleRunTool = async () => {
    setIsCallingTool(true);
    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(toolInputParams);
    } catch {
      alert('Invalid JSON in tool input parameters');
      setIsCallingTool(false);
      return;
    }

    const startTime = performance.now();

    try {
      const response = await fetch('/mcp/v1/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs
          }
        })
      });

      const rpcResult = await response.json();
      const duration = Math.round(performance.now() - startTime);

      setToolOutput(rpcResult);

      // Append to live logs
      const newEntry: MCPLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: 'INCOMING',
        endpoint: '/mcp/v1/rpc',
        tool: selectedTool,
        payload: parsedArgs,
        durationMs: duration,
        status: rpcResult.error ? 'ERROR' : 'SUCCESS'
      };
      setLogs(prev => [newEntry, ...prev.slice(0, 19)]);
    } catch (err: any) {
      setToolOutput({ error: err.message });
    } finally {
      setIsCallingTool(false);
    }
  };

  const handleCopyJson = (content: any) => {
    navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00BAF2]/20 border border-[#00BAF2]/40 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[#00BAF2]" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Paytm VoiceLend MCP Ecosystem Inspector</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Model Context Protocol server gateway for super-apps, fintech engines, and neobanks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[10px] block font-bold">Standard</span>
            <span className="font-mono text-emerald-400 font-bold">JSON-RPC 2.0 / MCP</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[10px] block font-bold">Target Merchant</span>
            <span className="font-bold text-white">{selectedMerchant.id}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('rpc')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'rpc' ? 'bg-[#002970] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live JSON-RPC Traffic
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'tools' ? 'bg-[#002970] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          MCP Tool Execution Playground
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'graph' ? 'bg-[#002970] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GitFork className="w-4 h-4" />
          Cognee Credit Graph Visualizer
        </button>

        <button
          onClick={() => setActiveTab('biometrics')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'biometrics' ? 'bg-[#002970] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Voice Biometric Embedding Space
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-[#002970] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Regulatory Consent Audit Ledger
        </button>
      </div>

      {/* TAB 1: Live JSON-RPC Traffic */}
      {activeTab === 'rpc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Server Capabilities Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#002970]" />
              MCP Server Protocol Manifest
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono text-[11px]">
                <p className="text-slate-400">Endpoint: <strong className="text-blue-700">/mcp/v1/rpc</strong></p>
                <p className="text-slate-400">Spec: <strong className="text-emerald-700">Model Context Protocol 2024-11-05</strong></p>
                <p className="text-slate-400">Auth: <strong className="text-slate-700">Ecosystem Token / Bearer</strong></p>
              </div>

              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-3">
                Registered Tools ({MCP_TOOLS_MANIFEST.length})
              </p>

              {MCP_TOOLS_MANIFEST.map((tool) => (
                <div key={tool.name} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-[11px]">{tool.name}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">active</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Traffic Terminal Log */}
          <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-2xl text-green-400 font-mono text-xs flex flex-col min-h-[440px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-200 font-bold">STREAM: /mcp/v1/rpc traffic</span>
              </div>
              <span className="text-[10px] text-slate-400">{logs.length} events logged</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 max-h-[460px]">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400 font-bold">[{log.direction}]</span>
                      <span className="text-yellow-400 font-semibold">{log.tool}</span>
                      <span className="text-slate-500">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">{log.durationMs}ms</span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                  </div>
                  <pre className="text-[10px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl overflow-x-auto border border-slate-900">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Tool Execution Playground */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Interactive MCP Tool Execution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoke standardized VoiceLend tools directly over the protocol interface
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {MCP_TOOLS_MANIFEST.map((t) => (
              <button
                key={t.name}
                onClick={() => handleSelectTool(t.name)}
                className={`p-3 rounded-2xl border text-left transition ${
                  selectedTool === t.name
                    ? 'bg-[#002970] text-white border-[#002970] shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <p className="font-mono text-xs font-bold truncate">{t.name}</p>
                <p className={`text-[10px] mt-1 line-clamp-2 ${selectedTool === t.name ? 'text-blue-200' : 'text-slate-500'}`}>
                  {t.description}
                </p>
              </button>
            ))}
          </div>

          {/* Input / Output Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input Arguments JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">JSON-RPC "arguments" Parameter:</label>
                <span className="text-[10px] text-slate-400 font-mono">schema validated</span>
              </div>
              <textarea
                rows={10}
                value={toolInputParams}
                onChange={(e) => setToolInputParams(e.target.value)}
                className="w-full font-mono text-xs p-3.5 bg-slate-900 text-green-400 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRunTool}
                disabled={isCallingTool}
                className="w-full py-3 bg-[#002970] hover:bg-[#001D52] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition"
              >
                <Play className="w-4 h-4 text-[#00BAF2] fill-current" />
                {isCallingTool ? 'Calling MCP Server...' : `Execute "${selectedTool}"`}
              </button>
            </div>

            {/* Output Response */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Server JSON-RPC Response:</label>
                {toolOutput && (
                  <button
                    onClick={() => handleCopyJson(toolOutput)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="h-[275px] bg-slate-900 rounded-2xl p-3.5 border border-slate-800 overflow-y-auto font-mono text-xs text-slate-200">
                {toolOutput ? (
                  <pre className="text-[11px] text-emerald-400">
                    {JSON.stringify(toolOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-center">
                    <p>Click "Execute" to run the tool and inspect the returned payload</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Cognee Credit Graph Visualizer (Module B) */}
      {activeTab === 'graph' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Alternative Credit Graph Topology (Cognee-Inspired)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vector-graph mapping daily QR transaction volume, repayment reliability, and cash-flow velocity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cash Flow Velocity</span>
              <p className="text-2xl font-black text-[#002970] mt-1">
                ₹{selectedMerchant.graphMetrics.cashFlowVelocity.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-600"> / day</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Direct daily settlement turnover rate</p>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Supplier Repayment Reliability</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {(selectedMerchant.graphMetrics.supplierRepaymentReliability * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Verified wholesale distributor clearances</p>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Network Centrality</span>
              <p className="text-2xl font-black text-purple-700 mt-1">
                {(selectedMerchant.graphMetrics.networkCentrality * 100).toFixed(0)}th
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Kirana cluster cluster centrality index</p>
            </div>
          </div>

          {/* Interactive Graph Node Representation */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white relative overflow-hidden">
            <p className="text-xs font-bold text-[#00BAF2] uppercase tracking-wider mb-4">
              Merchant Trust Graph Connections ({selectedMerchant.name})
            </p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6">
              
              {/* Node 1: Soundbox QR Stream */}
              <div className="w-full md:w-1/3 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-[#00BAF2] mx-auto flex items-center justify-center mb-2">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm text-white">Soundbox QR Transactions</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ~{selectedMerchant.avgDailyTxnCount} settlements/day
                </p>
                <div className="mt-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full inline-block">
                  Dispute rate: {selectedMerchant.graphMetrics.settlementDisputeRate}%
                </div>
              </div>

              {/* Central Hub: The Merchant */}
              <div className="w-full md:w-1/3 bg-gradient-to-br from-[#002970] to-[#0058e6] border-2 border-[#00BAF2] p-5 rounded-3xl text-center shadow-xl shadow-blue-500/10">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#002970] mx-auto flex items-center justify-center mb-2 font-black text-lg">
                  {selectedMerchant.id.replace('M_', '')}
                </div>
                <h4 className="font-black text-base text-white">{selectedMerchant.name}</h4>
                <p className="text-xs text-blue-200 mt-0.5">{selectedMerchant.storeType}</p>
                <div className="mt-3 bg-white/15 px-3 py-1 rounded-xl text-xs font-bold text-emerald-300">
                  Credit Trust: {(selectedMerchant.trustScore * 100).toFixed(0)}%
                </div>
              </div>

              {/* Node 3: Supplier & Wholesale Edges */}
              <div className="w-full md:w-1/3 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl">
                <h4 className="font-bold text-xs text-[#00BAF2] uppercase tracking-wider mb-2">
                  Verified Supplier Nodes ({selectedMerchant.graphMetrics.topSuppliers.length})
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedMerchant.graphMetrics.topSuppliers.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <div>
                        <p className="font-medium text-slate-200 text-[11px]">{s.name}</p>
                        <p className="text-[9px] text-slate-500">{s.category}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {(s.trustWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Voice Biometrics Embedding Space (Module 2) */}
      {activeTab === 'biometrics' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Voice Biometric Security & Anti-Spoofing Firewall</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dual-layer speaker embedding cosine verification & dynamic challenge phrases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vector Space Inspection */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">Enrolled 128-Dimensional Acoustic Embedding</h4>
              <p className="text-[11px] text-slate-500">
                Acoustic feature vector sampled across 16kHz spectral bins during merchant onboarding:
              </p>
              
              <div className="bg-slate-900 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[10px] text-blue-300">
                [{selectedMerchant.voiceEmbeddingSeed.slice(0, 32).join(', ')}, ... +96 more dims]
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500">Biometric Template ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedMerchant.enrolledVoiceId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Cosine Threshold for Authorization:</span>
                <span className="font-bold text-emerald-600">&gt;= 0.880 (88.0%)</span>
              </div>
            </div>

            {/* Anti-Spoofing Architecture */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">Dual-Layer Threat Firewall</h4>
              
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Layer 1: Passive Speaker Embedding</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cosine distance verification against enrolled voice print prevents unauthorized employees or passersby from disbursing loans.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Layer 2: Dynamic Challenge Phrase</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Random 4-digit code generated per transaction prevents replay attacks using pre-recorded audio recordings of the merchant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Regulatory Audit Ledger (Module D) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Regulatory Compliance & Oral Consent Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically hashed audit ledger complying with RBI Master Directions on Digital Lending
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
              SHA-256 Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Merchant</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Device Fingerprint</th>
                  <th className="py-2.5">SHA-256 Consent Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition font-mono text-[11px]">
                    <td className="py-3 text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 font-bold text-slate-800 font-sans">{item.merchantName} ({item.merchantId})</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        item.action.includes('VERIFIED') || item.action.includes('DISBURSED')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{item.deviceFingerprint}</td>
                    <td className="py-3 text-slate-500 truncate max-w-[160px]" title={item.sha256Hash}>
                      {item.sha256Hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
