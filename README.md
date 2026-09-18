# Paytm VoiceLend

> **Ecosystem-Grade Model Context Protocol (MCP) Server & Agentic Voice-Native Micro-Lending Platform for India's 60M Micro-Merchants (Kiranas).**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/MCP-2024--11--05-brightgreen.svg)](https://modelcontextprotocol.io/)
[![RBI Guidelines](https://img.shields.io/badge/RBI-Digital%20Lending%20Compliant-002970.svg)](https://www.rbi.org.in/)

---

## 🚀 Overview

**Paytm VoiceLend** is a hybrid Model Context Protocol (MCP) server and mobile-first progressive web app engineered for Kirana store owners. It brings instant micro-credit to shopkeepers through vernacular voice interaction (Hinglish, Tanglish, Kannada, English), verified by dual-layer voice biometric security and underwritten with zero-hallucination deterministic financial math.

### Key Value Propositions
- **No Standalone App Required:** Plugs directly into the Paytm Super-App or any fintech neobank ecosystem via standardized MCP endpoints (`/mcp/v1/rpc`).
- **Zero-Paperwork Voice Lending:** Merchants apply verbally in conversational code-mixed Indian dialects.
- **Dual-Layer Voice Biometric Firewall:** Protects against unauthorized device access and pre-recorded audio replay attacks.
- **Alternative Trust Graph (Cognee-inspired):** Credit evaluation built on daily QR settlement velocity and wholesale distributor clearance history rather than rigid collateral.
- **Regulatory Oral KFS Player:** Enforces mandatory audio Key Fact Statement disclosure before unlocking disbursement confirmation.

---

## 🏛️ Core Architecture

```
                                  ┌───────────────────────────────┐
                                  │   Paytm Super-App / Fintech   │
                                  └───────────────┬───────────────┘
                                                  │ MCP Protocol (JSON-RPC 2.0)
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │          Paytm VoiceLend Core MCP Server Layer          │
                     ├────────────────────────────┬────────────────────────────┤
                     │  voice_intent_parser       │  graph_credit_scorer       │
                     │  deterministic_underwriter │  voice_kfs_generator       │
                     └───────────────┬────────────────────────────┬────────────┘
                                     │                            │
             ┌───────────────────────┴──────────┐      ┌──────────┴─────────────────────────┐
             │ Voice Biometric Security Gate    │      │ Deterministic Financial Middleware │
             ├──────────────────────────────────┤      ├────────────────────────────────────┤
             │ • 128-dim Embedding Cosine Match │      │ • Reducing-Balance Formula         │
             │ • Dynamic 4-Digit Challenge Code │      │ • Regulatory 24% APR Ceiling       │
             │ • Anti-Spoofing & Replay Filter  │      │ • Soundbox Daily Sweep Calculation │
             └──────────────────────────────────┘      └────────────────────────────────────┘
```

---

## 🛠️ Standardized MCP Tools

| Tool Name | Description | Key Inputs |
|---|---|---|
| `voice_intent_parser` | Parses code-mixed vernacular transcripts into structured loan entities | `transcript`, `audio_sampling_rate` |
| `graph_credit_scorer` | Traverses merchant supplier nodes and QR volume to compute trust score | `merchant_id` |
| `deterministic_underwriter` | Computes exact monthly EMI and daily Soundbox sweep with zero LLM math | `merchant_id`, `requested_amount`, `tenure_months` |
| `voice_kfs_generator` | Generates RBI-compliant Key Fact Statement and vernacular oral script | `merchant_id`, `principal`, `tenure_months`, `language` |

---

## 🔒 Voice Biometric Threat Model & Firewall

1. **Speaker Embedding Verification:**
   - Compares incoming 128-dimensional acoustic vectors against the merchant's enrolled biometric profile.
   - Requires cosine similarity $\ge 0.88$ for authorization.
2. **Dynamic Challenge Phrase:**
   - Generates an ephemeral 4-digit code (e.g. `4892`) that must be read aloud.
   - Neutralizes replay attacks and synthetic deepfake voice clones.
3. **Cryptographic Oral Consent Ledger:**
   - Every loan approval is recorded with a SHA-256 hash containing timestamp, merchant ID, audio biometric signature, and device fingerprint.

---

## 📊 Comprehensive Synthetic Pilot Dataset

Includes 5 diverse retail merchant profiles across Karnataka:
- **M_8812 (Mysuru):** Rajesh Kirana Store — ₹1,50,000 monthly QR vol, 0.95 trust score, pre-qualified ₹25,000.
- **M_9921 (Bengaluru):** Priya Fresh Juice & Snacks — ₹85,000 monthly QR vol, 0.88 trust score, pre-qualified ₹15,000.
- **M_4410 (Hubli):** Sharma General Store — ₹3,20,000 monthly QR vol, 0.92 trust score, pre-qualified ₹50,000.
- **M_7734 (Mangaluru):** Laxmi Provision Stores — ₹45,000 monthly QR vol, 0.72 trust score, under manual review.
- **M_1102 (Belagavi):** Ganesh Auto Parts — ₹2,10,000 monthly QR vol, 0.96 trust score, pre-qualified ₹40,000.

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm or bun

### Installation
```bash
git clone https://github.com/jenaarmaan/paytm-voicelend.git
cd paytm-voicelend
npm install
```

### Running Locally
```bash
# Start full-stack server (Express + Vite) on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production
```bash
npm run build
npm start
```

---

## 🧪 Testing the Endpoints

### 1. Tool Discovery
```bash
curl http://localhost:3000/mcp/v1/tools
```

### 2. JSON-RPC Tool Call
```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deterministic_underwriter",
      "arguments": {
        "merchant_id": "M_8812",
        "requested_amount": 25000,
        "tenure_months": 3
      }
    }
  }'
```

---

## 👤 Author
- **Armaan Jena** ([@jenaarmaan](https://github.com/jenaarmaan))
- Email: [armaan.jena08@gmail.com](mailto:armaan.jena08@gmail.com)
