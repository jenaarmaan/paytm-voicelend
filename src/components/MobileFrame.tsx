import React from 'react';
import { Wifi, BatteryMedium, Radio, Volume2 } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isMobileShell: boolean;
  soundboxActive?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isMobileShell,
  soundboxActive = true
}) => {
  if (!isMobileShell) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </div>
    );
  }

  // Realistic Kirana Smart-POS / Smartphone Bezel
  return (
    <div className="py-6 px-2 flex justify-center items-center min-h-[calc(100vh-60px)] bg-slate-950/60">
      <div className="relative w-full max-w-[420px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/70 ring-1 ring-white/10">
        
        {/* Dynamic Island / Earpiece Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60 border border-blue-400/30"></div>
        </div>

        {/* Outer Phone Screen Display */}
        <div className="w-full bg-[#F5F7FA] text-slate-900 rounded-[34px] overflow-hidden flex flex-col min-h-[780px] max-h-[860px] shadow-inner relative">
          
          {/* Status Bar */}
          <div className="bg-[#002970] text-white px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-medium z-30 select-none">
            <span className="font-bold tracking-tight">10:08</span>
            
            {/* Soundbox 4G Active Status Pill */}
            <div className="flex items-center gap-1.5 bg-[#001D52] px-2 py-0.5 rounded-full border border-[#003899] text-[10px]">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span className="text-[#00BAF2] font-semibold">Soundbox 4G</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Scrollable Main Content Container */}
          <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="bg-slate-100 py-1.5 flex justify-center items-center border-t border-slate-200">
            <div className="w-32 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
