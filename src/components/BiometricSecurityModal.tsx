import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Mic, AlertTriangle, RefreshCw, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { Merchant, VoiceVerificationResult } from '../types.ts';
import { generateDynamicChallenge, simulateVoiceFeatureVector, verifyVoiceBiometrics } from '../lib/biometrics.ts';
import { VoiceWaveform } from './VoiceWaveform.tsx';

interface BiometricSecurityModalProps {
  isOpen: boolean;
  merchant: Merchant;
  requestedAmount: number;
  onSuccess: (result: VoiceVerificationResult) => void;
  onCancel: () => void;
}

export const BiometricSecurityModal: React.FC<BiometricSecurityModalProps> = ({
  isOpen,
  merchant,
  requestedAmount,
  onSuccess,
  onCancel
}) => {
  const [challengeCode, setChallengeCode] = useState<string>('4892');
  const [isVerifying, setIsVerifying] = useState(false);
  const [simulateAttack, setSimulateAttack] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VoiceVerificationResult | null>(null);
  const [spokenCode, setSpokenCode] = useState<string>('4892');
  const [activeStep, setActiveStep] = useState<'prompt' | 'processing' | 'result'>('prompt');

  useEffect(() => {
    if (isOpen) {
      const code = generateDynamicChallenge();
      setChallengeCode(code);
      setSpokenCode(code);
      setVerificationResult(null);
      setActiveStep('prompt');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartVerification = async () => {
    setIsVerifying(true);
    setActiveStep('processing');

    // Simulate audio vector capture & network round-trip to /api/v1/secure/verify-voice
    setTimeout(async () => {
      const audioVector = simulateVoiceFeatureVector(merchant.voiceEmbeddingSeed, simulateAttack);
      
      try {
        const response = await fetch('/api/v1/secure/verify-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId: merchant.id,
            audioFeatures: audioVector,
            challengeCodeExpected: challengeCode,
            spokenChallengeCode: simulateAttack ? '0000' : challengeCode,
            isSimulatedAttack: simulateAttack
          })
        });

        if (response.ok) {
          const data = await response.json();
          setVerificationResult(data.result);
        } else {
          // Fallback client-side verification calculation
          const fallbackResult = verifyVoiceBiometrics(merchant, {
            merchantId: merchant.id,
            audioFeatures: audioVector,
            challengeCodeExpected: challengeCode,
            spokenChallengeCode: simulateAttack ? '0000' : challengeCode,
            isSimulatedAttack: simulateAttack
          });
          setVerificationResult(fallbackResult);
        }
      } catch {
        const fallbackResult = verifyVoiceBiometrics(merchant, {
          merchantId: merchant.id,
          audioFeatures: audioVector,
          challengeCodeExpected: challengeCode,
          spokenChallengeCode: simulateAttack ? '0000' : challengeCode,
          isSimulatedAttack: simulateAttack
        });
        setVerificationResult(fallbackResult);
      }

      setIsVerifying(false);
      setActiveStep('result');
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#002970] text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Shield className="w-5 h-5 text-[#00BAF2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">Voice Biometric Firewall</h3>
                <p className="text-[11px] text-blue-200">Anti-Spoofing & Unauthorized Device Protection</p>
              </div>
            </div>
            <div className="bg-[#00BAF2]/20 border border-[#00BAF2]/40 text-[#00BAF2] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Gate Active
            </div>
          </div>

          <div className="mt-4 bg-[#001D52] p-3 rounded-2xl border border-[#003899] flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-300">Enrolled Voice Profile</p>
              <p className="font-bold text-white">{merchant.ownerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-300">Disbursement Request</p>
              <p className="font-bold text-[#00BAF2]">₹{requestedAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {activeStep === 'prompt' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  To prevent unauthorized loan requests from unlocked Kirana phones, speak the dynamic 4-digit code shown below clearly.
                </p>
              </div>

              {/* Dynamic 4-Digit Challenge Display */}
              <div className="text-center py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Speak This Dynamic Challenge Code
                </p>
                <div className="bg-slate-50 border-2 border-dashed border-blue-200 py-3 rounded-2xl">
                  <span className="text-4xl font-extrabold tracking-[0.6em] text-[#002970] ml-3">
                    {challengeCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  Say: "Verify loan request {challengeCode.split('').join('-')}"
                </p>
              </div>

              {/* Threat Simulation Mode (Tester Feature) */}
              <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${simulateAttack ? 'text-red-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Test Firewall with Threat Attack</p>
                      <p className="text-[10px] text-slate-500">Simulate stranger voice / pre-recorded replay</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulateAttack(!simulateAttack)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      simulateAttack ? 'bg-red-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        simulateAttack ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {simulateAttack && (
                  <p className="text-[10px] text-red-600 font-medium mt-1.5 pt-1.5 border-t border-red-200">
                    ⚠️ Attack mode armed: Audio feature vector will be perturbed to test unauthorized voice rejection (&lt; 0.88 cosine similarity).
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/3 py-3 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartVerification}
                  className="w-2/3 py-3 rounded-2xl text-xs font-bold text-white bg-[#002970] hover:bg-[#001D52] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition"
                >
                  <Mic className="w-4 h-4 text-[#00BAF2]" />
                  Speak & Verify Identity
                </button>
              </div>
            </div>
          )}

          {activeStep === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 mx-auto flex items-center justify-center animate-pulse">
                <Mic className="w-8 h-8 text-[#002970]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Analyzing Voice Acoustic Vector...</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculating 128-dim cosine similarity against enrolled profile
                </p>
              </div>
              <VoiceWaveform isListening={true} height={40} />
            </div>
          )}

          {activeStep === 'result' && verificationResult && (
            <div className="space-y-4">
              {verificationResult.verified ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-extrabold text-emerald-950 text-base">Identity Verified</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Voice embeddings match authorized merchant profile.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-2" />
                  <h4 className="font-extrabold text-red-950 text-base">Firewall Blocked Request</h4>
                  <p className="text-xs text-red-800 mt-1">
                    Acoustic profile or challenge phrase mismatch detected.
                  </p>
                </div>
              )}

              {/* Biometric Verification Metrics Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Cosine Similarity Score:</span>
                  <span className={`font-bold ${
                    verificationResult.cosineSimilarity >= 0.88 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {(verificationResult.cosineSimilarity * 100).toFixed(1)}% (Threshold: 88%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Dynamic Challenge Code:</span>
                  <span className={`font-bold ${verificationResult.challengeMatched ? 'text-emerald-600' : 'text-red-600'}`}>
                    {verificationResult.challengeMatched ? 'PASSED (Exact Match)' : 'FAILED (Mismatch)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Anti-Spoofing & Liveness:</span>
                  <span className="font-bold text-slate-800">
                    {(verificationResult.antiSpoofScore * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              {/* Decision Action */}
              {verificationResult.verified ? (
                <button
                  type="button"
                  onClick={() => onSuccess(verificationResult)}
                  className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-[#00B96B] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Proceed to Regulatory KFS Confirmation
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-1/2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulateAttack(false);
                      setActiveStep('prompt');
                    }}
                    className="w-1/2 py-3 rounded-2xl text-xs font-bold text-white bg-[#002970] hover:bg-[#001D52] flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Authorized Voice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
