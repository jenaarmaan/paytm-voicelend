export interface Merchant {
  id: string;
  name: string;
  ownerName: string;
  storeType: string;
  location: string;
  phone: string;
  monthlyVol: number;
  avgDailyTxnCount: number;
  trustScore: number; // 0.0 - 1.0
  status: 'PRE_QUALIFIED' | 'UNDER_REVIEW' | 'REJECTED';
  limit: number;
  enrolledVoiceId: string;
  voiceEmbeddingSeed: number[]; // 128-dimensional synthetic embedding
  soundboxActive: boolean;
  yearsInBusiness: number;
  cibilEquivalent: number;
  gstNumber?: string;
  dailySweepPercentage: number; // e.g. 15% of daily QR settlements
  graphMetrics: {
    supplierRepaymentReliability: number; // 0.0 - 1.0
    cashFlowVelocity: number; // ₹/day
    networkCentrality: number; // 0.0 - 1.0
    settlementDisputeRate: number; // percentage
    topSuppliers: Array<{ name: string; category: string; trustWeight: number }>;
    distributorNodes: number;
    peerEndorsements: number;
  };
}

export interface EMICalculationResult {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  dailySweepAmount: number; // for 26 Kirana operating days/month
  totalInterest: number;
  totalRepayment: number;
  processingFee: number; // 2%
  gstOnFee: number; // 18% on fee
  netDisbursement: number;
  apr: number;
  amortization: Array<{
    month: number;
    openingBalance: number;
    emi: number;
    principalPaid: number;
    interestPaid: number;
    closingBalance: number;
  }>;
}

export interface ParsedLoanIntent {
  rawTranscript: string;
  detectedLanguage: 'Hinglish' | 'Tanglish' | 'Kannada' | 'English';
  loanAmount: number;
  tenureMonths: number;
  purpose: string;
  urgency: 'Immediate' | 'Standard' | 'Exploratory';
  confidenceScore: number;
  extractedEntities: {
    amountEntity: string;
    tenureEntity: string;
    purposeEntity: string;
  };
}

export interface VoiceVerificationRequest {
  merchantId: string;
  audioFeatures: number[]; // 128-dim vector
  challengeCodeExpected: string;
  spokenChallengeCode: string;
  isSimulatedAttack?: boolean;
}

export interface VoiceVerificationResult {
  verified: boolean;
  cosineSimilarity: number;
  threshold: number;
  challengeMatched: boolean;
  antiSpoofScore: number;
  spectralEntropy: number;
  reasons: string[];
  verificationTimestamp: string;
  biometricToken?: string;
}

export interface KeyFactStatement {
  kfsId: string;
  merchantId: string;
  merchantName: string;
  loanAmount: number;
  tenureMonths: number;
  annualRate: number;
  processingFee: number;
  monthlyEMI: number;
  dailySweepAmount: number;
  netDisbursalAmount: number;
  totalRepayment: number;
  coolingOffPeriodDays: number;
  oralConsentText: string;
  audioDurationSeconds: number;
  rbiRegistrationNumber: string;
  lendingPartner: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  merchantId: string;
  merchantName: string;
  action: 'VOICE_INTENT_PARSED' | 'BIOMETRIC_VERIFIED' | 'BIOMETRIC_REJECTED' | 'KFS_ORAL_CONFIRMED' | 'LOAN_DISBURSED';
  details: any;
  sha256Hash: string;
  deviceFingerprint: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPLogEntry {
  id: string;
  timestamp: string;
  direction: 'INCOMING' | 'OUTGOING' | 'INTERNAL';
  endpoint: string;
  tool: string;
  payload: any;
  durationMs?: number;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
}
