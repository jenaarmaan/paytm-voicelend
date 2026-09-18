import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

import { MERCHANTS } from './src/data/merchants.ts';
import {
  MCP_TOOLS_MANIFEST,
  executeVoiceIntentParser,
  executeGraphCreditScorer,
  executeDeterministicUnderwriter,
  executeVoiceKFSGenerator
} from './src/lib/mcp.ts';
import { verifyVoiceBiometrics, calculateCosineSimilarity, BIOMETRIC_SIMILARITY_THRESHOLD } from './src/lib/biometrics.ts';
import { AuditRecord } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory Audit Trail store
  const auditLogs: AuditRecord[] = [
    {
      id: 'AUD_INIT_001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      merchantId: 'M_8812',
      merchantName: 'Rajesh Kirana Store',
      action: 'BIOMETRIC_VERIFIED',
      details: {
        method: 'SPEAKER_EMBEDDING_COSINE',
        score: 0.942,
        challenge: '4892',
        antiSpoof: 'PASSED'
      },
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      deviceFingerprint: 'PAYTM_SOUNDBOX_V4_8812'
    }
  ];

  // ----------------------------------------------------
  // Health & Information Endpoints
  // ----------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Paytm VoiceLend Ecosystem MCP Server',
      version: '1.0.4',
      protocol: 'MCP/2024-11-05',
      merchantsCount: MERCHANTS.length,
      toolsAvailable: MCP_TOOLS_MANIFEST.map(t => t.name)
    });
  });

  app.get('/api/v1/merchants', (_req: Request, res: Response) => {
    res.json({ merchants: MERCHANTS });
  });

  app.get('/api/v1/audit-trail', (_req: Request, res: Response) => {
    res.json({ auditLogs });
  });

  // ----------------------------------------------------
  // Model Context Protocol (MCP) Standard Endpoints
  // ----------------------------------------------------
  
  // 1. Tool Manifest Discovery
  app.get('/mcp/v1/tools', (_req: Request, res: Response) => {
    res.json({
      jsonrpc: '2.0',
      tools: MCP_TOOLS_MANIFEST,
      server_info: {
        name: 'paytm-voicelend-mcp',
        version: '1.0.4',
        environment: 'fintech-ecosystem-pilot'
      }
    });
  });

  // 2. Standard JSON-RPC 2.0 Handler
  app.post('/mcp/v1/rpc', (req: Request, res: Response) => {
    const { jsonrpc, id, method, params } = req.body;

    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
      });
    }

    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: 'Paytm VoiceLend MCP Server',
            version: '1.0.4'
          }
        }
      });
    }

    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS_MANIFEST
        }
      });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let toolOutput: any;
        switch (toolName) {
          case 'voice_intent_parser':
            toolOutput = executeVoiceIntentParser(args.transcript || '');
            break;
          case 'graph_credit_scorer':
            toolOutput = executeGraphCreditScorer(args.merchant_id || 'M_8812');
            break;
          case 'deterministic_underwriter':
            toolOutput = executeDeterministicUnderwriter(
              args.merchant_id || 'M_8812',
              Number(args.requested_amount || 25000),
              Number(args.tenure_months || 3)
            );
            break;
          case 'voice_kfs_generator':
            toolOutput = executeVoiceKFSGenerator(
              args.merchant_id || 'M_8812',
              Number(args.principal || 25000),
              Number(args.tenure_months || 3),
              args.language || 'Hinglish'
            );
            break;
          default:
            return res.status(404).json({
              jsonrpc: '2.0',
              id,
              error: { code: -32601, message: `Tool "${toolName}" not found` }
            });
        }

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolOutput, null, 2)
              }
            ],
            isError: false,
            data: toolOutput
          }
        });
      } catch (err: any) {
        return res.status(500).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: err.message || 'Internal tool execution error' }
        });
      }
    }

    return res.status(404).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method "${method}" not found` }
    });
  });

  // 3. REST Wrapper for Tool Invocation
  app.post('/mcp/v1/tools/:toolName', (req: Request, res: Response) => {
    const { toolName } = req.params;
    const args = req.body || {};

    try {
      let result: any;
      switch (toolName) {
        case 'voice_intent_parser':
          result = executeVoiceIntentParser(args.transcript || '');
          break;
        case 'graph_credit_scorer':
          result = executeGraphCreditScorer(args.merchant_id || 'M_8812');
          break;
        case 'deterministic_underwriter':
          result = executeDeterministicUnderwriter(
            args.merchant_id || 'M_8812',
            Number(args.requested_amount || 25000),
            Number(args.tenure_months || 3)
          );
          break;
        case 'voice_kfs_generator':
          result = executeVoiceKFSGenerator(
            args.merchant_id || 'M_8812',
            Number(args.principal || 25000),
            Number(args.tenure_months || 3),
            args.language || 'Hinglish'
          );
          break;
        default:
          return res.status(404).json({ error: `Tool "${toolName}" not found` });
      }

      res.json({ success: true, tool: toolName, data: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // Voice Biometrics & Anti-Spoofing Firewall
  // ----------------------------------------------------
  app.post('/api/v1/secure/verify-voice', (req: Request, res: Response) => {
    const { merchantId, audioFeatures, challengeCodeExpected, spokenChallengeCode, isSimulatedAttack } = req.body;

    const merchant = MERCHANTS.find(m => m.id === merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const verification = verifyVoiceBiometrics(merchant, {
      merchantId,
      audioFeatures: audioFeatures || merchant.voiceEmbeddingSeed,
      challengeCodeExpected: challengeCodeExpected || '4892',
      spokenChallengeCode: spokenChallengeCode || '4892',
      isSimulatedAttack: Boolean(isSimulatedAttack)
    });

    // Generate cryptographic hash of verification event
    const hashPayload = JSON.stringify({
      merchantId,
      timestamp: verification.verificationTimestamp,
      score: verification.cosineSimilarity,
      challenge: challengeCodeExpected,
      verified: verification.verified
    });
    const sha256 = crypto.createHash('sha256').update(hashPayload).digest('hex');

    // Audit log
    auditLogs.unshift({
      id: `AUD_BIO_${Date.now()}`,
      timestamp: verification.verificationTimestamp,
      merchantId: merchant.id,
      merchantName: merchant.name,
      action: verification.verified ? 'BIOMETRIC_VERIFIED' : 'BIOMETRIC_REJECTED',
      details: {
        similarity: verification.cosineSimilarity,
        threshold: verification.threshold,
        challengePassed: verification.challengeMatched,
        antiSpoofScore: verification.antiSpoofScore,
        attackSimulated: isSimulatedAttack
      },
      sha256Hash: sha256,
      deviceFingerprint: `PAYTM_POS_${merchant.id}`
    });

    res.json({
      success: verification.verified,
      result: verification,
      auditHash: sha256
    });
  });

  // ----------------------------------------------------
  // Loan Disbursement & Consent Logging
  // ----------------------------------------------------
  app.post('/api/v1/loan/disburse', (req: Request, res: Response) => {
    const { merchantId, loanAmount, tenureMonths, kfsId, biometricToken } = req.body;

    const merchant = MERCHANTS.find(m => m.id === merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!biometricToken) {
      return res.status(403).json({ error: 'Biometric authorization token missing or expired' });
    }

    const underwrite = executeDeterministicUnderwriter(merchantId, loanAmount, tenureMonths);
    const txnRef = `PAYTM_DISB_${merchant.id}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const consentMessage = JSON.stringify({
      merchantId,
      txnRef,
      kfsId,
      loanAmount,
      netDisbursement: underwrite.net_disbursed_to_merchant,
      timestamp
    });
    const consentHash = crypto.createHash('sha256').update(consentMessage).digest('hex');

    auditLogs.unshift({
      id: `AUD_DISB_${Date.now()}`,
      timestamp,
      merchantId: merchant.id,
      merchantName: merchant.name,
      action: 'LOAN_DISBURSED',
      details: {
        txnRef,
        principal: loanAmount,
        netDisbursed: underwrite.net_disbursed_to_merchant,
        tenureMonths,
        monthlyEMI: underwrite.monthly_emi,
        dailySweep: underwrite.daily_soundbox_sweep
      },
      sha256Hash: consentHash,
      deviceFingerprint: `PAYTM_SOUNDBOX_${merchant.id}`
    });

    res.json({
      success: true,
      transactionReference: txnRef,
      merchantName: merchant.name,
      disbursedAmount: underwrite.net_disbursed_to_merchant,
      monthlyEMI: underwrite.monthly_emi,
      dailySoundboxSweep: underwrite.daily_soundbox_sweep,
      consentHash,
      status: 'DISBURSED_TO_PAYTM_WALLET_AND_BANK',
      soundboxNotification: `Paytm par ₹${underwrite.net_disbursed_to_merchant.toLocaleString('en-IN')} prapt hue.`
    });
  });

  // ----------------------------------------------------
  // Vite Integration
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Paytm VoiceLend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
