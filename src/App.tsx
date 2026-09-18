/**
 * Paytm VoiceLend - Ecosystem-Grade Model Context Protocol (MCP) Server
 * & Agentic Voice-Native Micro-Lending Platform for Kirana Merchants
 */

import React, { useState } from 'react';
import { MERCHANTS } from './data/merchants.ts';
import { Merchant } from './types.ts';
import { PaytmHeader } from './components/PaytmHeader.tsx';
import { MobileFrame } from './components/MobileFrame.tsx';
import { VoiceLendAppView } from './components/VoiceLendAppView.tsx';
import { McpInspectorView } from './components/McpInspectorView.tsx';

export default function App() {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant>(MERCHANTS[0]);
  const [activeView, setActiveView] = useState<'mobile' | 'wide' | 'mcp'>('mobile');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-900 flex flex-col selection:bg-[#00BAF2] selection:text-slate-950">
      {/* Top Paytm Enterprise Header */}
      <PaytmHeader
        selectedMerchant={selectedMerchant}
        onSelectMerchant={(m) => setSelectedMerchant(m)}
        activeView={activeView}
        onChangeView={(v) => setActiveView(v)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col justify-start">
        {activeTabRenderer()}
      </main>

      {/* Subtle Regulatory & Protocol Footer */}
      <footer className="bg-slate-950 text-slate-500 text-[10px] py-3 px-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Paytm VoiceLend Engine • Reserve Bank of India (RBI) Digital Lending Guidelines Compliant</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>MCP: /mcp/v1/rpc</span>
          <span>Zero-Hallucination Math</span>
          <span>Biometric Cosine: &gt;= 0.88</span>
        </div>
      </footer>
    </div>
  );

  function activeTabRenderer() {
    switch (activeView) {
      case 'mobile':
        return (
          <MobileFrame isMobileShell={true} soundboxActive={selectedMerchant.soundboxActive}>
            <VoiceLendAppView
              merchant={selectedMerchant}
              onOpenMcpInspector={() => setActiveView('mcp')}
              soundEnabled={soundEnabled}
            />
          </MobileFrame>
        );
      case 'wide':
        return (
          <MobileFrame isMobileShell={false} soundboxActive={selectedMerchant.soundboxActive}>
            <VoiceLendAppView
              merchant={selectedMerchant}
              onOpenMcpInspector={() => setActiveView('mcp')}
              soundEnabled={soundEnabled}
            />
          </MobileFrame>
        );
      case 'mcp':
        return (
          <McpInspectorView
            selectedMerchant={selectedMerchant}
            onSelectMerchant={(m) => setSelectedMerchant(m)}
          />
        );
      default:
        return null;
    }
  }
}
