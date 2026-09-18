import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Lock, Unlock, ShieldCheck, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { KeyFactStatement, Merchant } from '../types.ts';
import { speakKFS } from '../lib/soundbox.ts';
import { formatINR } from '../lib/finance.ts';

interface VoiceKFSPlayerProps {
  kfs: KeyFactStatement;
  merchant: Merchant;
  onConsentGiven: () => void;
  onCancel: () => void;
}

export const VoiceKFSPlayer: React.FC<VoiceKFSPlayerProps> = ({
  kfs,
  merchant,
  onConsentGiven,
  onCancel
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackCompleted, setPlaybackCompleted] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'Hinglish' | 'Kannada' | 'Tanglish' | 'English'>('Hinglish');
  const speechController = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (speechController.current) {
        speechController.current.stop();
      }
    };
  }, []);

  const handleTogglePlayback = () => {
    if (isPlaying) {
      if (speechController.current) speechController.current.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speechController.current = speakKFS(
        kfs.oralConsentText,
        (progress) => setPlaybackProgress(progress),
        () => {
          setIsPlaying(false);
          setPlaybackCompleted(true);
          setPlaybackProgress(100);
        }
      );
    }
  };

  const handleRestart = () => {
    if (speechController.current) speechController.current.stop();
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPlaybackCompleted(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#002970] text-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00BAF2]" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Regulatory Key Fact Statement (KFS)</h3>
              <p className="text-[10px] sm:text-xs text-blue-200">Mandatory RBI Oral Consent & Disclosure</p>
            </div>
          </div>
          <span className="bg-[#00BAF2]/20 border border-[#00BAF2]/40 text-[#00BAF2] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Oral Contract
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Important Terms Matrix */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Sanctioned Principal:</span>
            <span className="font-bold text-slate-800">{formatINR(kfs.loanAmount)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Tenure & Rate (APR):</span>
            <span className="font-bold text-slate-800">{kfs.tenureMonths} Months @ {kfs.annualRate}% p.a.</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Monthly EMI:</span>
            <span className="font-extrabold text-[#002970]">{formatINR(kfs.monthlyEMI)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Soundbox Daily QR Sweep:</span>
            <span className="font-bold text-emerald-600">{formatINR(kfs.dailySweepAmount)} / day</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Upfront Processing Fee + GST:</span>
            <span className="font-medium text-slate-700">{formatINR(kfs.processingFee)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Net Disbursement to Bank:</span>
            <span className="font-black text-emerald-700">{formatINR(kfs.netDisbursalAmount)}</span>
          </div>
        </div>

        {/* Audio Player Card */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-900">Mandatory Audio Disclosure</span>
            </div>
            <div className="text-[10px] font-bold text-blue-700">
              {playbackProgress}% Played
            </div>
          </div>

          <p className="text-[11px] text-slate-600 italic bg-white/80 p-2.5 rounded-xl border border-blue-100 mb-3 line-clamp-3">
            "{kfs.oralConsentText}"
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="bg-[#00BAF2] h-full transition-all duration-300"
              style={{ width: `${playbackProgress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTogglePlayback}
              className="flex-1 py-2.5 px-4 bg-[#002970] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#001D52] transition shadow"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Oral Reading
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {playbackProgress > 0 ? 'Resume Audio Reading' : 'Listen to Full Audio KFS'}
                </>
              )}
            </button>

            {playbackProgress > 0 && (
              <button
                type="button"
                onClick={handleRestart}
                className="p-2.5 bg-white border border-blue-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                title="Replay from start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lock / Unlock Status Notice */}
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition ${
          playbackCompleted
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {playbackCompleted ? (
            <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span className="text-[11px] leading-tight">
            {playbackCompleted
              ? 'Oral disclosure completed. Regulatory authorization gate unlocked.'
              : 'RBI Regulatory Compliance: You must listen to the full audio statement before confirmation unlocks.'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-3 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={!playbackCompleted}
            onClick={onConsentGiven}
            className={`w-2/3 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              playbackCompleted
                ? 'bg-[#00B96B] hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {playbackCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Confirm Oral Consent & Disburse
          </button>
        </div>
      </div>
    </div>
  );
};
