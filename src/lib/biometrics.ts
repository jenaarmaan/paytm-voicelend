import { VoiceVerificationRequest, VoiceVerificationResult, Merchant } from '../types.ts';

export const BIOMETRIC_SIMILARITY_THRESHOLD = 0.88;

/**
 * Computes cosine similarity between two float vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Generate a random dynamic 4-digit challenge code
 */
export function generateDynamicChallenge(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generates an audio feature vector for testing or live Web Audio input
 * If authentic merchant: slight natural acoustic noise (cosine similarity ~0.92 - 0.96)
 * If imposter / spoof attack: completely different vector or perturbed spectrum (similarity ~0.45 - 0.76)
 */
export function simulateVoiceFeatureVector(
  baseSeedVector: number[],
  isAttacker: boolean = false
): number[] {
  if (isAttacker) {
    // Generate an orthogonal / perturbed vector representing an intruder's voice
    return baseSeedVector.map((val, idx) => {
      const noise = (Math.sin(idx * 7.7) * 0.9);
      return Number((-val * 0.4 + noise * 0.6).toFixed(5));
    });
  }

  // Authentic speaker: small variance from ambient acoustics
  return baseSeedVector.map(val => {
    const acousticJitter = (Math.random() - 0.5) * 0.08;
    return Number((val + acousticJitter).toFixed(5));
  });
}

/**
 * Verify Voice Biometrics against enrolled profile & dynamic challenge
 */
export function verifyVoiceBiometrics(
  merchant: Merchant,
  request: VoiceVerificationRequest
): VoiceVerificationResult {
  const reasons: string[] = [];
  const similarity = calculateCosineSimilarity(request.audioFeatures, merchant.voiceEmbeddingSeed);
  const challengeMatched = request.spokenChallengeCode.trim() === request.challengeCodeExpected.trim();

  // Spectral entropy calculation (mocked acoustic variance check)
  const variance = request.audioFeatures.reduce((acc, v) => acc + Math.abs(v), 0) / (request.audioFeatures.length || 1);
  const spectralEntropy = Number((0.75 + (variance * 0.25)).toFixed(3));

  // Anti-spoofing heuristics
  let antiSpoofScore = 0.94;
  if (request.isSimulatedAttack) {
    antiSpoofScore = 0.32;
    reasons.push('Anti-spoofing firewall detected synthetic/replayed spectral distortion');
  }

  if (similarity < BIOMETRIC_SIMILARITY_THRESHOLD) {
    reasons.push(`Voice embedding mismatch: ${(similarity * 100).toFixed(1)}% < ${(BIOMETRIC_SIMILARITY_THRESHOLD * 100)}% threshold`);
  }

  if (!challengeMatched) {
    reasons.push(`Challenge response mismatch: heard "${request.spokenChallengeCode}", expected "${request.challengeCodeExpected}"`);
  }

  const verified = similarity >= BIOMETRIC_SIMILARITY_THRESHOLD && challengeMatched && !request.isSimulatedAttack;

  return {
    verified,
    cosineSimilarity: Number(similarity.toFixed(4)),
    threshold: BIOMETRIC_SIMILARITY_THRESHOLD,
    challengeMatched,
    antiSpoofScore,
    spectralEntropy,
    reasons: verified ? ['Acoustic vectors match enrolled voice model', 'Dynamic liveness challenge verified'] : reasons,
    verificationTimestamp: new Date().toISOString(),
    biometricToken: verified ? `bio_tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}` : undefined
  };
}

/**
 * Cryptographic SHA-256 hash for regulatory oral consent audit trail
 */
export async function generateConsentHash(data: {
  merchantId: string;
  loanAmount: number;
  tenureMonths: number;
  timestamp: string;
  challengeCode: string;
  biometricScore: number;
}): Promise<string> {
  const message = JSON.stringify(data);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simple checksum if WebCrypto unavailable in test
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}
