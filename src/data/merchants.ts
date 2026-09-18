import { Merchant } from '../types.ts';

// Deterministic normalized 128-dim vector generator for synthetic voice embeddings
function generateNormalizedVector(seed: number): number[] {
  const vec: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    // Linear congruential pseudo-random generator
    const val = Math.sin(seed * (i + 1) * 9301 + 49297) * 233280;
    const normalized = (val - Math.floor(val)) * 2 - 1;
    vec.push(normalized);
    sumSq += normalized * normalized;
  }
  const mag = Math.sqrt(sumSq) || 1;
  return vec.map(v => Number((v / mag).toFixed(5)));
}

export const MERCHANTS: Merchant[] = [
  {
    id: 'M_8812',
    name: 'Rajesh Kirana Store',
    ownerName: 'Rajesh Kumar Gowda',
    storeType: 'FMCG & Kirana Daily Essentials',
    location: 'Mysuru, Karnataka',
    phone: '+91 98450 12881',
    monthlyVol: 150000,
    avgDailyTxnCount: 88,
    trustScore: 0.95,
    status: 'PRE_QUALIFIED',
    limit: 25000,
    enrolledVoiceId: 'voice_rk_mys_8812',
    voiceEmbeddingSeed: generateNormalizedVector(8812),
    soundboxActive: true,
    yearsInBusiness: 8,
    cibilEquivalent: 785,
    gstNumber: '29AAAPK8812K1Z5',
    dailySweepPercentage: 15,
    graphMetrics: {
      supplierRepaymentReliability: 0.98,
      cashFlowVelocity: 5800,
      networkCentrality: 0.89,
      settlementDisputeRate: 0.1,
      topSuppliers: [
        { name: 'Mysore Wholesale Grains', category: 'Staples', trustWeight: 0.96 },
        { name: 'HUL Super Stockist', category: 'FMCG', trustWeight: 0.99 },
        { name: 'Amul Milk Hub', category: 'Dairy', trustWeight: 0.94 }
      ],
      distributorNodes: 7,
      peerEndorsements: 14
    }
  },
  {
    id: 'M_9921',
    name: 'Priya Fresh Juice & Snacks',
    ownerName: 'Priya Sundaram',
    storeType: 'Quick Service Retail & Snacks',
    location: 'Bengaluru (Koramangala), Karnataka',
    phone: '+91 97312 99210',
    monthlyVol: 85000,
    avgDailyTxnCount: 125,
    trustScore: 0.88,
    status: 'PRE_QUALIFIED',
    limit: 15000,
    enrolledVoiceId: 'voice_ps_blr_9921',
    voiceEmbeddingSeed: generateNormalizedVector(9921),
    soundboxActive: true,
    yearsInBusiness: 4,
    cibilEquivalent: 742,
    gstNumber: '29AABCP9921P1Z9',
    dailySweepPercentage: 18,
    graphMetrics: {
      supplierRepaymentReliability: 0.91,
      cashFlowVelocity: 3200,
      networkCentrality: 0.82,
      settlementDisputeRate: 0.4,
      topSuppliers: [
        { name: 'K.R. Market Fresh Fruits', category: 'Perishables', trustWeight: 0.89 },
        { name: 'Nandini Dairy Depot', category: 'Dairy', trustWeight: 0.95 }
      ],
      distributorNodes: 5,
      peerEndorsements: 9
    }
  },
  {
    id: 'M_4410',
    name: 'Sharma General Store',
    ownerName: 'Devendra Sharma',
    storeType: 'Super Kirana & Provisions',
    location: 'Hubli (Station Road), Karnataka',
    phone: '+91 94481 44100',
    monthlyVol: 320000,
    avgDailyTxnCount: 195,
    trustScore: 0.92,
    status: 'PRE_QUALIFIED',
    limit: 50000,
    enrolledVoiceId: 'voice_ds_hub_4410',
    voiceEmbeddingSeed: generateNormalizedVector(4410),
    soundboxActive: true,
    yearsInBusiness: 12,
    cibilEquivalent: 798,
    gstNumber: '29AADPS4410D1Z2',
    dailySweepPercentage: 14,
    graphMetrics: {
      supplierRepaymentReliability: 0.95,
      cashFlowVelocity: 11500,
      networkCentrality: 0.93,
      settlementDisputeRate: 0.2,
      topSuppliers: [
        { name: 'ITC Agro Distribution Hubli', category: 'FMCG', trustWeight: 0.98 },
        { name: 'Hubli Spices & Oils', category: 'Commodities', trustWeight: 0.92 },
        { name: 'Parle Agency Dharwad', category: 'Packaged Foods', trustWeight: 0.94 }
      ],
      distributorNodes: 12,
      peerEndorsements: 22
    }
  },
  {
    id: 'M_7734',
    name: 'Laxmi Provision Stores',
    ownerName: 'Suresh Shetty',
    storeType: 'Neighborhood Kirana',
    location: 'Mangaluru (Car Street), Karnataka',
    phone: '+91 98802 77340',
    monthlyVol: 45000,
    avgDailyTxnCount: 38,
    trustScore: 0.72,
    status: 'UNDER_REVIEW',
    limit: 0,
    enrolledVoiceId: 'voice_ss_mng_7734',
    voiceEmbeddingSeed: generateNormalizedVector(7734),
    soundboxActive: true,
    yearsInBusiness: 2,
    cibilEquivalent: 645,
    dailySweepPercentage: 20,
    graphMetrics: {
      supplierRepaymentReliability: 0.68,
      cashFlowVelocity: 1550,
      networkCentrality: 0.62,
      settlementDisputeRate: 1.8,
      topSuppliers: [
        { name: 'Coastal Traders', category: 'Provisions', trustWeight: 0.70 }
      ],
      distributorNodes: 3,
      peerEndorsements: 4
    }
  },
  {
    id: 'M_1102',
    name: 'Ganesh Auto Parts',
    ownerName: 'Ganesh Patil',
    storeType: 'Automotive Spares & Retail Services',
    location: 'Belagavi (Khanapur Rd), Karnataka',
    phone: '+91 94800 11020',
    monthlyVol: 210000,
    avgDailyTxnCount: 72,
    trustScore: 0.96,
    status: 'PRE_QUALIFIED',
    limit: 40000,
    enrolledVoiceId: 'voice_gp_bel_1102',
    voiceEmbeddingSeed: generateNormalizedVector(1102),
    soundboxActive: true,
    yearsInBusiness: 9,
    cibilEquivalent: 812,
    gstNumber: '29AAAPG1102G1Z8',
    dailySweepPercentage: 12,
    graphMetrics: {
      supplierRepaymentReliability: 0.99,
      cashFlowVelocity: 7800,
      networkCentrality: 0.91,
      settlementDisputeRate: 0.05,
      topSuppliers: [
        { name: 'Bajaj Genuine Spares Depot', category: 'OEM Parts', trustWeight: 0.98 },
        { name: 'Castrol Lubricants Belgaum', category: 'Lubricants', trustWeight: 0.97 },
        { name: 'MRF Tyre Stockist', category: 'Tyres', trustWeight: 0.95 }
      ],
      distributorNodes: 9,
      peerEndorsements: 19
    }
  }
];

export const PRESET_VOICE_COMMANDS = [
  {
    language: 'Hinglish' as const,
    label: 'Kirana Stock (₹25,000 / 3 Months)',
    text: 'Bhaiya agle somwar maal bharna hai, 25,000 ka loan 3 mahine ke liye dedo',
    amount: 25000,
    tenure: 3,
    purpose: 'Kirana inventory restocking for upcoming festive week'
  },
  {
    language: 'Hinglish' as const,
    label: 'Juice Stall Emergency (₹15,000 / 2 Months)',
    text: 'Emergency fruit stock purchase ke liye 15,000 rupaye chahiye 2 mahine ke liye',
    amount: 15000,
    tenure: 2,
    purpose: 'Perishable seasonal fruit bulk procurement'
  },
  {
    language: 'Hinglish' as const,
    label: 'Supplier Invoice (₹40,000 / 6 Months)',
    text: 'Wholesale distributor invoice payment ke liye 40,000 rupaye chahiye, 6 mahine ka EMI kardo',
    amount: 40000,
    tenure: 6,
    purpose: 'Wholesale distributor clear-down payment'
  },
  {
    language: 'Tanglish' as const,
    label: 'Tanglish Quick Cash (₹10,000 / 3 Months)',
    text: 'Enaku 10,000 rupees loan venum, 3 months tenure podhuma fast ah disburse pannunga',
    amount: 10000,
    tenure: 3,
    purpose: 'Working capital top-up for store counter'
  },
  {
    language: 'Kannada' as const,
    label: 'Kannada Provision Purchase (₹20,000 / 4 Months)',
    text: 'Namma angadige samagri tharalikke 20,000 rupaayi loan beku 4 tingalige',
    amount: 20000,
    tenure: 4,
    purpose: 'Store provisions and FMCG procurement'
  }
];
