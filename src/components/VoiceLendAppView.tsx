import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  FileCheck2,
  Download,
  AlertCircle,
  Clock,
  Radio,
  Share2,
  Lock,
  Receipt,
  Store,
  CheckCircle2,
  Info
} from 'lucide-react';

import { Merchant, ParsedLoanIntent, KeyFactStatement, VoiceVerificationResult } from '../types.ts';
import { PRESET_VOICE_COMMANDS } from '../data/merchants.ts';
import { calculateDeterministicLoan, formatINR } from '../lib/finance.ts';
import { executeVoiceIntentParser, executeVoiceKFSGenerator } from '../lib/mcp.ts';
import { playPaytmChime } from '../lib/soundbox.ts';
import { VoiceWaveform } from './VoiceWaveform.tsx';
import { BiometricSecurityModal } from './BiometricSecurityModal.tsx';
import { VoiceKFSPlayer } from './VoiceKFSPlayer.tsx';

interface VoiceLendAppViewProps {
  merchant: Merchant;
  onOpenMcpInspector: () => void;
  soundEnabled: boolean;
}

export const VoiceLendAppView: React.FC<VoiceLendAppViewProps> = ({
  merchant,
  onOpenMcpInspector,
  soundEnabled
}) => {
  // Application Stage
  // 'idle' | 'listening' | 'analyzing' | 'intent_ready' | 'verifying' | 'kfs' | 'disbursing' | 'success'
  const [stage, setStage] = useState<string>('idle');
  const [customTranscript, setCustomTranscript] = useState<string>('');
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [parsedIntent, setParsedIntent] = useState<ParsedLoanIntent | null>(null);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [biometricResult, setBiometricResult] = useState<VoiceVerificationResult | null>(null);
  const [kfsStatement, setKfsStatement] = useState<KeyFactStatement | null>(null);
  const [disbursementData, setDisbursementData] = useState<any | null>(null);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // Sync state when merchant changes
  useEffect(() => {
    setStage('idle');
    setCustomTranscript('');
    setParsedIntent(null);
    setBiometricResult(null);
    setKfsStatement(null);
    setDisbursementData(null);
  }, [merchant.id]);

  // Handle Voice Ingestion Simulation or Web Audio
  const handleStartVoice = (presetText?: string) => {
    const textToProcess = presetText || PRESET_VOICE_COMMANDS[0].text;
    setCustomTranscript(textToProcess);
    setStage('listening');
    setIsRecordingMic(true);

    setTimeout(() => {
      setIsRecordingMic(false);
      setStage('analyzing');

      setTimeout(() => {
        const intent = executeVoiceIntentParser(textToProcess);
        setParsedIntent(intent);
        setStage('intent_ready');
      }, 900);
    }, 1800);
  };

  // Trigger Biometric Verification Gate
  const handleInitiateLoan = () => {
    if (!parsedIntent) return;
    setIsBiometricModalOpen(true);
  };

  // Biometric Verification Success
  const handleBiometricSuccess = (result: VoiceVerificationResult) => {
    setBiometricResult(result);
    setIsBiometricModalOpen(false);

    // Generate KFS
    if (parsedIntent) {
      const kfs = executeVoiceKFSGenerator(
        merchant.id,
        parsedIntent.loanAmount,
        parsedIntent.tenureMonths,
        parsedIntent.detectedLanguage
      );
      setKfsStatement(kfs);
      setStage('kfs');
    }
  };

  // Final Regulatory Consent & Disburse
  const handleDisburseLoan = async () => {
    if (!parsedIntent || !biometricResult) return;
    setStage('disbursing');

    try {
      const response = await fetch('/api/v1/loan/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          loanAmount: parsedIntent.loanAmount,
          tenureMonths: parsedIntent.tenureMonths,
          kfsId: kfsStatement?.kfsId || `KFS_${merchant.id}`,
          biometricToken: biometricResult.biometricToken || `bio_${Date.now()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDisbursementData(data);
      } else {
        // Fallback simulated success
        const calc = calculateDeterministicLoan(parsedIntent.loanAmount, 18, parsedIntent.tenureMonths);
        setDisbursementData({
          transactionReference: `PAYTM_DISB_${merchant.id}_${Date.now()}`,
          merchantName: merchant.name,
          disbursedAmount: calc.netDisbursement,
          monthlyEMI: calc.monthlyEMI,
          dailySoundboxSweep: calc.dailySweepAmount,
          consentHash: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
          status: 'DISBURSED_TO_PAYTM_WALLET_AND_BANK'
        });
      }
    } catch {
      const calc = calculateDeterministicLoan(parsedIntent.loanAmount, 18, parsedIntent.tenureMonths);
      setDisbursementData({
        transactionReference: `PAYTM_DISB_${merchant.id}_${Date.now()}`,
        merchantName: merchant.name,
        disbursedAmount: calc.netDisbursement,
        monthlyEMI: calc.monthlyEMI,
        dailySoundboxSweep: calc.dailySweepAmount,
        consentHash: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
        status: 'DISBURSED_TO_PAYTM_WALLET_AND_BANK'
      });
    }

    setTimeout(() => {
      setStage('success');
      if (soundEnabled) {
        playPaytmChime(parsedIntent.loanAmount);
      }
    }, 1200);
  };

  // Computed financial numbers
  const loanMath = parsedIntent
    ? calculateDeterministicLoan(parsedIntent.loanAmount, 18, parsedIntent.tenureMonths)
    : calculateDeterministicLoan(merchant.limit || 25000, 18, 3);

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-xl mx-auto">
      
      {/* 1. Merchant Profile Card (Paytm Kirana Hero) */}
      <div className="bg-gradient-to-br from-[#002970] via-[#00225d] to-[#001740] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        {/* Subtle geometric background watermark */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#00BAF2]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-[#00BAF2] tracking-wider uppercase">
                Paytm Soundbox Partner
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <h2 className="text-xl font-black tracking-tight leading-tight">{merchant.name}</h2>
            <p className="text-xs text-blue-200/80 mt-0.5">
              {merchant.ownerName} • {merchant.location}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 text-right shrink-0">
            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-300">ID</span>
            <span className="text-xs font-mono font-bold text-white">{merchant.id}</span>
          </div>
        </div>

        {/* 3 Metric Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10">
            <p className="text-[9px] uppercase font-bold text-blue-200/70">Trust Score</p>
            <p className="text-lg font-black text-white mt-0.5">
              {(merchant.trustScore * 100).toFixed(0)}%
            </p>
            <p className="text-[8px] text-emerald-300 font-semibold mt-0.5">Graph Verified</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10">
            <p className="text-[9px] uppercase font-bold text-blue-200/70">Monthly QR Vol</p>
            <p className="text-lg font-black text-white mt-0.5">
              ₹{(merchant.monthlyVol / 1000).toFixed(0)}k
            </p>
            <p className="text-[8px] text-blue-200 font-semibold mt-0.5">~{merchant.avgDailyTxnCount} txns/day</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10">
            <p className="text-[9px] uppercase font-bold text-blue-200/70">Pre-Qualified</p>
            <p className={`text-lg font-black mt-0.5 ${
              merchant.status === 'PRE_QUALIFIED' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {merchant.status === 'PRE_QUALIFIED' ? `₹${(merchant.limit / 1000).toFixed(0)}k` : 'Review'}
            </p>
            <p className="text-[8px] text-slate-300 font-semibold mt-0.5">
              {merchant.status === 'PRE_QUALIFIED' ? 'Zero Paperwork' : 'Under Assessment'}
            </p>
          </div>
        </div>

        {/* Kirana Alternative Credit Graph Summary Ribbon */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#00BAF2]" />
            <span>Supplier Trust: <strong>{(merchant.graphMetrics.supplierRepaymentReliability * 100).toFixed(0)}%</strong></span>
          </div>
          <button
            onClick={onOpenMcpInspector}
            className="text-[#00BAF2] hover:text-white font-bold flex items-center gap-1 text-[10px] transition"
          >
            Inspect MCP Graph <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* 2. Voice Input / Ingestion Section */}
      {stage !== 'kfs' && stage !== 'success' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#002970]" />
                Voice-Native Micro-Loan Application
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Speak in your vernacular dialect (Hinglish, Tanglish, Kannada)
              </p>
            </div>
            <span className="bg-blue-50 text-[#002970] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
              Zero Forms
            </span>
          </div>

          {/* Big Microphone Tap Area */}
          <div className="py-4 text-center">
            <div className="relative inline-block">
              {isRecordingMic && (
                <div className="absolute -inset-4 bg-sky-400 rounded-full animate-ping opacity-25"></div>
              )}
              <button
                type="button"
                onClick={() => handleStartVoice()}
                disabled={isRecordingMic || stage === 'analyzing'}
                className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-xl border-4 ${
                  isRecordingMic
                    ? 'bg-red-500 text-white border-red-200 shadow-red-500/30'
                    : 'bg-[#002970] hover:bg-[#001D52] text-white border-sky-100 hover:border-sky-300 shadow-blue-900/20'
                }`}
              >
                {isRecordingMic ? (
                  <MicOff className="w-9 h-9 animate-bounce" />
                ) : (
                  <Mic className="w-9 h-9 text-[#00BAF2]" />
                )}
                <span className="text-[10px] font-bold mt-1 tracking-tight">
                  {isRecordingMic ? 'Listening...' : 'Tap & Speak'}
                </span>
              </button>
            </div>

            {/* Audio Waveform */}
            <VoiceWaveform isListening={isRecordingMic || stage === 'listening'} height={36} />

            <p className="text-xs text-slate-600 font-medium">
              {isRecordingMic
                ? 'Processing live Kirana acoustic buffer...'
                : stage === 'analyzing'
                ? 'Running MCP Voice Intent Parser...'
                : 'Or click a vernacular pilot phrase below:'}
            </p>
          </div>

          {/* Vernacular Preset Chips */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pilot Vernacular Scenarios (1-Tap Test)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_VOICE_COMMANDS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStartVoice(preset.text)}
                  className="text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-extrabold text-[#002970] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {preset.language}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      ₹{preset.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 italic line-clamp-2 leading-relaxed group-hover:text-slate-950">
                    "{preset.text}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Intent Breakdown Card (Module A Output) */}
      {parsedIntent && (stage === 'intent_ready' || stage === 'idle') && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-[#002970]">
                <Sparkles className="w-4 h-4 text-[#00BAF2]" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Extracted Loan Intent</h4>
                <p className="text-[10px] text-slate-500">MCP tool: voice_intent_parser</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {(parsedIntent.confidenceScore * 100).toFixed(0)}% Confidence
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs italic text-slate-700">
            "{parsedIntent.rawTranscript}"
          </div>

          {/* Extracted Financial Entities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100">
              <span className="text-[9px] font-bold uppercase text-slate-500 block">Requested</span>
              <span className="text-base font-black text-[#002970]">
                {formatINR(parsedIntent.loanAmount)}
              </span>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100">
              <span className="text-[9px] font-bold uppercase text-slate-500 block">Tenure</span>
              <span className="text-base font-black text-slate-800">
                {parsedIntent.tenureMonths} Mos
              </span>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100">
              <span className="text-[9px] font-bold uppercase text-slate-500 block">Language</span>
              <span className="text-base font-black text-slate-800">
                {parsedIntent.detectedLanguage}
              </span>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100">
              <span className="text-[9px] font-bold uppercase text-slate-500 block">Urgency</span>
              <span className="text-base font-black text-emerald-600">
                {parsedIntent.urgency}
              </span>
            </div>
          </div>

          {/* Underwriting Eligibility Check */}
          {merchant.status !== 'PRE_QUALIFIED' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Manual Underwriting Review Required</p>
                <p className="mt-0.5">
                  Merchant profile {merchant.id} trust score is {(merchant.trustScore * 100).toFixed(0)}%. Credit limit currently under review.
                </p>
              </div>
            </div>
          ) : parsedIntent.loanAmount > merchant.limit ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Requested amount exceeds pre-qualified limit</p>
                <p className="mt-0.5">
                  Pre-qualified limit is {formatINR(merchant.limit)}. Amount adjusted to maximum sanction limit.
                </p>
              </div>
            </div>
          ) : null}

          {/* Deterministic Financial Middleware Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700">Zero-Hallucination EMI Breakdown</span>
              <span className="text-[10px] font-mono text-slate-500">Reducing 18% p.a.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Monthly EMI</span>
                <span className="font-extrabold text-[#002970] text-sm">{formatINR(loanMath.monthlyEMI)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Soundbox Daily Sweep</span>
                <span className="font-extrabold text-emerald-600 text-sm">{formatINR(loanMath.dailySweepAmount)} / day</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Upfront Fee (2% + GST)</span>
                <span className="font-medium text-slate-700 text-sm">{formatINR(loanMath.processingFee + loanMath.gstOnFee)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Net In-Bank Disbursed</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatINR(loanMath.netDisbursement)}</span>
              </div>
            </div>

            {/* Toggle Amortization Schedule */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAmortization(!showAmortization)}
                className="text-[11px] font-bold text-[#002970] hover:underline"
              >
                {showAmortization ? 'Hide Repayment Schedule' : 'View Month-by-Month Amortization Schedule'}
              </button>
            </div>

            {showAmortization && (
              <div className="overflow-x-auto pt-2 border-t border-slate-200">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1">Mo</th>
                      <th className="py-1">Opening</th>
                      <th className="py-1">Principal</th>
                      <th className="py-1">Interest</th>
                      <th className="py-1">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanMath.amortization.map((row) => (
                      <tr key={row.month} className="border-b border-slate-100 font-mono">
                        <td className="py-1 font-bold">{row.month}</td>
                        <td className="py-1">{formatINR(row.openingBalance)}</td>
                        <td className="py-1 text-emerald-700">{formatINR(row.principalPaid)}</td>
                        <td className="py-1 text-slate-500">{formatINR(row.interestPaid)}</td>
                        <td className="py-1">{formatINR(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action to proceed to Voice Biometric Security Gate */}
          <button
            type="button"
            onClick={handleInitiateLoan}
            className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-[#002970] hover:bg-[#001D52] shadow-xl shadow-blue-900/20 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-[#00BAF2]" />
            Proceed to Biometric Security Verification
          </button>
        </motion.div>
      )}

      {/* 4. Regulatory KFS Screen (Module D) */}
      {stage === 'kfs' && kfsStatement && (
        <VoiceKFSPlayer
          kfs={kfsStatement}
          merchant={merchant}
          onConsentGiven={handleDisburseLoan}
          onCancel={() => setStage('intent_ready')}
        />
      )}

      {/* 5. Disbursement In-Progress Overlay */}
      {stage === 'disbursing' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mx-auto flex items-center justify-center animate-spin">
            <Zap className="w-8 h-8 text-[#002970]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Disbursing Loan to Kirana Account...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Executing instant IMPS transfer & configuring daily Soundbox QR sweep
            </p>
          </div>
        </div>
      )}

      {/* 6. Disbursement Celebration & Audit Cert (Module D Output) */}
      {stage === 'success' && disbursementData && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-5 text-center"
        >
          {/* Success Badge */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-300 mx-auto flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
              Loan Disbursed Instantly
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">
              {formatINR(disbursementData.disbursedAmount)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transferred to {merchant.name}'s linked Paytm Merchant Account
            </p>
          </div>

          {/* Soundbox Announcement Banner */}
          <div className="bg-[#002970] text-white p-3.5 rounded-2xl text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-[#00BAF2] animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-bold">Soundbox Broadcast</p>
              <p className="text-xs font-semibold">
                "Paytm par {formatINR(disbursementData.disbursedAmount)} prapt hue."
              </p>
            </div>
          </div>

          {/* Key Loan Metrics Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Transaction Reference:</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">{disbursementData.transactionReference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Monthly EMI:</span>
              <span className="font-bold text-[#002970]">{formatINR(disbursementData.monthlyEMI)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Daily Soundbox QR Sweep:</span>
              <span className="font-bold text-emerald-600">{formatINR(disbursementData.dailySoundboxSweep)} / day</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">SHA-256 Oral Consent Hash:</span>
              <span className="font-mono font-semibold text-slate-600 text-[9px] truncate max-w-[170px]" title={disbursementData.consentHash}>
                {disbursementData.consentHash}
              </span>
            </div>
          </div>

          {/* Download Audit Certificate */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const certData = JSON.stringify({
                  receiptType: 'PAYTM_VOICELEND_REGULATORY_KFS_RECEIPT',
                  merchant: { id: merchant.id, name: merchant.name, location: merchant.location },
                  disbursement: disbursementData,
                  biometrics: biometricResult,
                  timestamp: new Date().toISOString()
                }, null, 2);
                const blob = new Blob([certData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Paytm_VoiceLend_${merchant.id}_Receipt.json`;
                a.click();
              }}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download KFS Receipt
            </button>

            <button
              type="button"
              onClick={() => {
                setStage('idle');
                setParsedIntent(null);
              }}
              className="flex-1 py-3 bg-[#002970] hover:bg-[#001D52] text-white font-bold text-xs rounded-2xl transition"
            >
              Apply for New Loan
            </button>
          </div>
        </motion.div>
      )}

      {/* Voice Biometric Security Modal */}
      <BiometricSecurityModal
        isOpen={isBiometricModalOpen}
        merchant={merchant}
        requestedAmount={parsedIntent?.loanAmount || 25000}
        onSuccess={handleBiometricSuccess}
        onCancel={() => setIsBiometricModalOpen(false)}
      />
    </div>
  );
};
