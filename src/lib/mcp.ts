import { MCPToolDefinition, ParsedLoanIntent, KeyFactStatement } from '../types.ts';
import { MERCHANTS } from '../data/merchants.ts';
import { calculateDeterministicLoan, formatINR } from './finance.ts';

export const MCP_TOOLS_MANIFEST: MCPToolDefinition[] = [
  {
    name: 'voice_intent_parser',
    description: 'Converts raw audio transcripts or buffers into structured financial entities (loan amount, tenure, purpose, language, urgency).',
    input_schema: {
      type: 'object',
      properties: {
        transcript: { type: 'string', description: 'Raw voice transcription text in Hinglish, Tanglish, Kannada, or English' },
        audio_sampling_rate: { type: 'number', description: 'Audio sampling rate in Hz (optional, defaults to 16000)' }
      },
      required: ['transcript']
    }
  },
  {
    name: 'graph_credit_scorer',
    description: 'Queries alternative trust graphs using merchant daily transaction metrics, supplier repayment reliability, and cash-flow velocity.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'The unique merchant identifier (e.g., M_8812)' }
      },
      required: ['merchant_id']
    }
  },
  {
    name: 'deterministic_underwriter',
    description: 'Evaluates loan eligibility and calculates exact EMIs, daily Soundbox sweep, and fee structures using hardcoded zero-hallucination math.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'Merchant ID' },
        requested_amount: { type: 'number', description: 'Requested loan principal in INR' },
        tenure_months: { type: 'number', description: 'Tenure in months (1-12)' }
      },
      required: ['merchant_id', 'requested_amount', 'tenure_months']
    }
  },
  {
    name: 'voice_kfs_generator',
    description: 'Synthesizes regulatory Key Fact Statements (KFS) complying with RBI digital lending guidelines for mandatory oral audio confirmation.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'Merchant ID' },
        principal: { type: 'number', description: 'Loan amount' },
        tenure_months: { type: 'number', description: 'Tenure' },
        language: { type: 'string', enum: ['Hinglish', 'Tanglish', 'Kannada', 'English'], description: 'Oral prompt language' }
      },
      required: ['merchant_id', 'principal', 'tenure_months']
    }
  }
];

/**
 * Parses raw code-mixed vernacular loan queries into structured entities
 */
export function executeVoiceIntentParser(transcript: string): ParsedLoanIntent {
  const normalized = transcript.toLowerCase();
  
  // Detect language heuristics
  let detectedLanguage: 'Hinglish' | 'Tanglish' | 'Kannada' | 'English' = 'Hinglish';
  if (/venum|podhuma|pannunga|enaku/i.test(normalized)) {
    detectedLanguage = 'Tanglish';
  } else if (/beku|tingalige|namma|angadige|rupaayi/i.test(normalized)) {
    detectedLanguage = 'Kannada';
  } else if (/urgent|working capital|supplier|invoice/i.test(normalized) && !/chahiye|rupaye|bhaiya/i.test(normalized)) {
    detectedLanguage = 'English';
  }

  // Extract amount with regex patterns (e.g., 25,000, 25000, 10k, 25 hazar, 1 lakh)
  let loanAmount = 25000; // default fallback
  let amountEntity = '25,000';
  const numMatches = normalized.match(/(?:₹|rs\.?|rupees|rupaye|rupaayi)?\s*(\d{1,3}(?:,\d{3})+|\d+)\s*(?:k|hazar|thousand|lakh)?/i);
  
  if (numMatches && numMatches[1]) {
    const rawDigits = parseInt(numMatches[1].replace(/,/g, ''), 10);
    if (rawDigits > 0) {
      if (/hazar|thousand|k\b/i.test(normalized) && rawDigits < 1000) {
        loanAmount = rawDigits * 1000;
      } else if (/lakh/i.test(normalized) && rawDigits < 100) {
        loanAmount = rawDigits * 100000;
      } else {
        loanAmount = rawDigits;
      }
      amountEntity = formatINR(loanAmount);
    }
  }

  // Extract tenure (e.g., 3 mahine, 6 months, 60 din, 90 days)
  let tenureMonths = 3;
  let tenureEntity = '3 Months';
  const monthMatch = normalized.match(/(\d+)\s*(?:mahine|months?|tingalige|maheene)/i);
  const dayMatch = normalized.match(/(\d+)\s*(?:din|days?)/i);

  if (monthMatch && monthMatch[1]) {
    tenureMonths = Math.max(1, Math.min(12, parseInt(monthMatch[1], 10)));
    tenureEntity = `${tenureMonths} Months`;
  } else if (dayMatch && dayMatch[1]) {
    const days = parseInt(dayMatch[1], 10);
    tenureMonths = Math.max(1, Math.min(12, Math.round(days / 30)));
    tenureEntity = `${days} Days (~${tenureMonths} Months)`;
  }

  // Detect purpose
  let purpose = 'Store working capital and inventory replenishment';
  let purposeEntity = 'Working Capital';
  if (/fruit|juice|perishable/i.test(normalized)) {
    purpose = 'Perishable seasonal fruit bulk procurement';
    purposeEntity = 'Fruit Stock Procurement';
  } else if (/supplier|distributor|invoice|payment/i.test(normalized)) {
    purpose = 'Wholesale distributor invoice clearance';
    purposeEntity = 'Supplier Payment';
  } else if (/maal|kirana|stock|bharna|provisions/i.test(normalized)) {
    purpose = 'Kirana inventory restocking';
    purposeEntity = 'Inventory Restock';
  } else if (/emergency|fast/i.test(normalized)) {
    purpose = 'Emergency immediate retail liquidity';
    purposeEntity = 'Emergency Counter Liquidity';
  }

  // Urgency detection
  let urgency: 'Immediate' | 'Standard' | 'Exploratory' = 'Standard';
  if (/emergency|fast|turant|jaldi|urgent/i.test(normalized)) {
    urgency = 'Immediate';
  }

  return {
    rawTranscript: transcript,
    detectedLanguage,
    loanAmount,
    tenureMonths,
    purpose,
    urgency,
    confidenceScore: 0.96,
    extractedEntities: {
      amountEntity,
      tenureEntity,
      purposeEntity
    }
  };
}

/**
 * MCP Graph Credit Scorer tool execution
 */
export function executeGraphCreditScorer(merchantId: string) {
  const merchant = MERCHANTS.find(m => m.id === merchantId) || MERCHANTS[0];
  const { graphMetrics } = merchant;

  // Synthesize alternative credit score factors from trust graph
  const qrTransactionScore = Math.min(1.0, merchant.avgDailyTxnCount / 150);
  const volumeStability = Math.min(1.0, merchant.monthlyVol / 200000);
  const compositeScore = Number(
    (
      graphMetrics.supplierRepaymentReliability * 0.35 +
      qrTransactionScore * 0.25 +
      volumeStability * 0.20 +
      graphMetrics.networkCentrality * 0.15 -
      (graphMetrics.settlementDisputeRate / 100) * 0.05
    ).toFixed(3)
  );

  return {
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    location: merchant.location,
    composite_trust_score: compositeScore,
    status: merchant.status,
    pre_qualified_limit: merchant.limit,
    graph_topology: {
      total_supplier_nodes: graphMetrics.topSuppliers.length,
      distributor_nodes: graphMetrics.distributorNodes,
      peer_kirana_endorsements: graphMetrics.peerEndorsements,
      cash_flow_velocity_inr_day: graphMetrics.cashFlowVelocity,
      soundbox_settlement_reliability: `${(graphMetrics.supplierRepaymentReliability * 100).toFixed(1)}%`,
      network_centrality_percentile: `${(graphMetrics.networkCentrality * 100).toFixed(0)}th`
    },
    risk_assessment: compositeScore >= 0.85 ? 'LOW_RISK_PRIME' : compositeScore >= 0.70 ? 'MODERATE_MONITORED' : 'HIGH_RISK',
    decision: merchant.status === 'PRE_QUALIFIED' ? 'APPROVED' : 'MANUAL_UNDERWRITING'
  };
}

/**
 * MCP Deterministic Underwriter tool execution
 */
export function executeDeterministicUnderwriter(
  merchantId: string,
  requestedAmount: number,
  tenureMonths: number
) {
  const merchant = MERCHANTS.find(m => m.id === merchantId) || MERCHANTS[0];
  const isEligible = merchant.status === 'PRE_QUALIFIED' && requestedAmount <= merchant.limit;
  
  const approvedAmount = isEligible ? requestedAmount : Math.min(requestedAmount, merchant.limit);
  const interestRate = merchant.trustScore >= 0.90 ? 16.5 : 18.0;

  const financialMath = calculateDeterministicLoan(approvedAmount, interestRate, tenureMonths);

  // Maximum recommended daily sweep limit (cannot exceed 25% of average daily cash flow velocity)
  const maxSafeDailySweep = Math.round(merchant.graphMetrics.cashFlowVelocity * 0.25);
  const dailySweepSafe = financialMath.dailySweepAmount <= maxSafeDailySweep;

  return {
    merchant_id: merchant.id,
    eligible: isEligible,
    requested_amount: requestedAmount,
    approved_principal: approvedAmount,
    merchant_credit_limit: merchant.limit,
    tenure_months: tenureMonths,
    annual_percentage_rate: financialMath.apr,
    monthly_emi: financialMath.monthlyEMI,
    daily_soundbox_sweep: financialMath.dailySweepAmount,
    max_safe_daily_sweep: maxSafeDailySweep,
    daily_sweep_safe: dailySweepSafe,
    upfront_processing_fee: financialMath.processingFee,
    gst_on_fee: financialMath.gstOnFee,
    net_disbursed_to_merchant: financialMath.netDisbursement,
    total_interest: financialMath.totalInterest,
    total_repayment: financialMath.totalRepayment,
    amortization_schedule: financialMath.amortization
  };
}

/**
 * MCP Voice KFS Generator tool execution
 */
export function executeVoiceKFSGenerator(
  merchantId: string,
  principal: number,
  tenureMonths: number,
  language: 'Hinglish' | 'Tanglish' | 'Kannada' | 'English' = 'Hinglish'
): KeyFactStatement {
  const merchant = MERCHANTS.find(m => m.id === merchantId) || MERCHANTS[0];
  const calc = calculateDeterministicLoan(principal, 18.0, tenureMonths);

  let oralText = '';
  if (language === 'Hinglish') {
    oralText = `नमस्ते ${merchant.ownerName} जी। आपके ${merchant.name} के लिए ₹${calc.principal.toLocaleString('en-IN')} का लोन स्वीकृत हुआ है। अवधि ${calc.tenureMonths} महीने है। मासिक किस्त ₹${calc.monthlyEMI.toLocaleString('en-IN')} होगी, या प्रतिदिन साउंडबॉक्स से ₹${calc.dailySweepAmount} का ऑटो-स्वीप होगा। कुल ब्याज ₹${calc.totalInterest.toLocaleString('en-IN')} है। प्रोसेसिंग फीस ₹${calc.processingFee} काटकर आपके खाते में ₹${calc.netDisbursement.toLocaleString('en-IN')} ट्रांसफर होंगे। क्या आप इस लोन को स्वीकार करते हैं?`;
  } else if (language === 'Kannada') {
    oralText = `Namaskara ${merchant.ownerName} avare. Nimma ${merchant.name} ge ₹${calc.principal.toLocaleString('en-IN')} sala manzooragide. Avadhi ${calc.tenureMonths} tingalu. Tingala EMI ₹${calc.monthlyEMI.toLocaleString('en-IN')}, athava daily soundbox ninda ₹${calc.dailySweepAmount} auto-sweep aguttade. Idu nimge sammataviruvude?`;
  } else if (language === 'Tanglish') {
    oralText = `Vanakkam ${merchant.ownerName}. Ungalukku ₹${calc.principal.toLocaleString('en-IN')} loan approve aagirukku. Tenure ${calc.tenureMonths} months. Monthly EMI ₹${calc.monthlyEMI.toLocaleString('en-IN')}. Daily soundbox sweep ₹${calc.dailySweepAmount}. Neenga indha terms accept panreengala?`;
  } else {
    oralText = `Key Fact Statement for ${merchant.name}. Approved Principal: ₹${calc.principal.toLocaleString('en-IN')} for ${calc.tenureMonths} months at 18% APR. Monthly EMI is ₹${calc.monthlyEMI.toLocaleString('en-IN')} with daily QR settlement sweep of ₹${calc.dailySweepAmount}. Net disbursement after fees is ₹${calc.netDisbursement.toLocaleString('en-IN')}. Do you provide verbal consent to disburse?`;
  }

  return {
    kfsId: `KFS_${merchant.id}_${Date.now()}`,
    merchantId: merchant.id,
    merchantName: merchant.name,
    loanAmount: calc.principal,
    tenureMonths: calc.tenureMonths,
    annualRate: calc.annualRate,
    processingFee: calc.processingFee + calc.gstOnFee,
    monthlyEMI: calc.monthlyEMI,
    dailySweepAmount: calc.dailySweepAmount,
    netDisbursalAmount: calc.netDisbursement,
    totalRepayment: calc.totalRepayment,
    coolingOffPeriodDays: 3,
    oralConsentText: oralText,
    audioDurationSeconds: 12, // approx 12 seconds for speech synthesis
    rbiRegistrationNumber: 'RBI/NBFC-BLR/94021/2026',
    lendingPartner: 'Paytm Payments Bank / Lending Partner NBFC'
  };
}
