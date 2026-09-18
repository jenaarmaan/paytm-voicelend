import React from 'react';
import { Zap, Smartphone, Monitor, Terminal, Volume2, VolumeX, ShieldCheck, ChevronDown, Store } from 'lucide-react';
import { Merchant } from '../types.ts';
import { MERCHANTS } from '../data/merchants.ts';
import { playPaytmChime } from '../lib/soundbox.ts';

interface PaytmHeaderProps {
  selectedMerchant: Merchant;
  onSelectMerchant: (merchant: Merchant) => void;
  activeView: 'mobile' | 'wide' | 'mcp';
  onChangeView: (view: 'mobile' | 'wide' | 'mcp') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PaytmHeader: React.FC<PaytmHeaderProps> = ({
  selectedMerchant,
  onSelectMerchant,
  activeView,
  onChangeView,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#002970] text-white shadow-md border-b border-[#001D52]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5">
            {/* Paytm stylized emblem */}
            <div className="w-full h-full bg-[#002970] rounded-lg flex items-center justify-center">
              <Zap className="text-[#00BAF2] w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Paytm <span className="text-[#00BAF2]">VoiceLend</span>
              </span>
              <span className="bg-[#00BAF2]/20 text-[#00BAF2] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#00BAF2]/30 uppercase tracking-wide">
                MCP v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-300 hidden sm:block">
              Voice-Native Micro-Lending for 60M Indian Kiranas
            </p>
          </div>
        </div>

        {/* Center: Merchant Quick-Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-[#001D52] hover:bg-[#001740] border border-[#003899] px-3 py-1.5 rounded-xl cursor-pointer transition text-xs">
              <Store className="w-3.5 h-3.5 text-[#00BAF2]" />
              <div className="text-left">
                <p className="font-bold text-white text-[11px] leading-tight truncate max-w-[130px] sm:max-w-[160px]">
                  {selectedMerchant.name}
                </p>
                <p className="text-[9px] text-slate-300">
                  {selectedMerchant.location.split(',')[0]} • {selectedMerchant.status === 'PRE_QUALIFIED' ? `₹${(selectedMerchant.limit/1000)}k Limit` : 'Review'}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Synthetic Kirana Profile (5 Pilots)
              </div>
              {MERCHANTS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMerchant(m)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50/70 transition ${
                    m.id === selectedMerchant.id ? 'bg-blue-50/90 font-medium' : ''
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#002970]">{m.name}</p>
                    <p className="text-[10px] text-slate-500">{m.storeType} • {m.location.split(',')[0]}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      m.status === 'PRE_QUALIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.status === 'PRE_QUALIFIED' ? `₹${m.limit.toLocaleString('en-IN')}` : 'Review'}
                    </span>
                    <p className="text-[9px] text-slate-400">Trust {(m.trustScore * 100).toFixed(0)}%</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Switchers & Audio Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Soundbox audio test */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                playPaytmChime(25000);
              }
            }}
            title={soundEnabled ? 'Paytm Soundbox Audio Enabled' : 'Soundbox Muted'}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[#001D52] text-slate-400 border-[#003899] hover:bg-[#001740]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline text-[10px] font-bold">Soundbox</span>
          </button>

          {/* View Toggles */}
          <div className="flex bg-[#001D52] p-0.5 rounded-xl border border-[#003899]">
            <button
              onClick={() => onChangeView('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'mobile'
                  ? 'bg-white text-[#002970] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mobile Device Shell View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>

            <button
              onClick={() => onChangeView('wide')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'wide'
                  ? 'bg-white text-[#002970] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Wide Desktop Counter View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>

            <button
              onClick={() => onChangeView('mcp')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'mcp'
                  ? 'bg-[#00BAF2] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="MCP Fintech Inspector & JSON-RPC Protocol Console"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MCP Inspector</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping hidden sm:block"></span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
