# Dukaan Saathi 🛒

An AI assistant that lets small shop owners run their whole business — sales,
inventory, ledger (udhaar) — just by **talking, sending a WhatsApp message, or
snapping a photo of their notebook**. Understands **English, Hindi & Telugu**
(text and voice). The official website + live dashboard are also trilingual.

- **Marketing site** — the pitch (`/`)
- **WhatsApp simulator** — try the assistant with zero setup (`/simulator`)
- **Shop dashboard** — live sales, profit, inventory, dues, 7-day trend (`/app`)
- **Backend** — Express + SQLite, Claude parsing, Sarvam voice, Twilio WhatsApp

## Architecture

```
Voice note / text  ─▶  Sarvam STT (voice→text)  ─▶  Claude (understand + extract)
       │                                                     │
   WhatsApp (Twilio)  ── or ──  Web simulator                ▼
                                              intents → SQLite (sales/stock/udhaar)
                                                     │
                       localized reply (EN/HI/TE)  ◀─┘  →  live dashboard
```

The **same pipeline** powers real WhatsApp and the web simulator, so the demo
writes real data the dashboard reads.

## Quick start

```bash
# 1. Install (root = frontend, plus the backend package)
npm install
npm install --prefix server

# 2. Configure the backend (all keys optional — see graceful degradation below)
cp server/.env.example server/.env   # then edit server/.env

# 3. Run both frontend (5173) and backend (3001) together
npm run dev:all
```

Open **http://localhost:5173** → try `/simulator`, register a shop at `/login`,
watch `/app` update.

### Graceful degradation (works with no keys)
| Missing key | Behaviour |
|---|---|
| `ANTHROPIC_API_KEY` | Falls back to a built-in rule-based parser (English/Hinglish best) |
| `SARVAM_API_KEY` | Voice notes reply "voice not enabled"; text still works |
| `TWILIO_*` | Real WhatsApp off; the web simulator still fully works |

So you can demo the entire product immediately, then add keys for full accuracy
(especially Telugu voice + parsing).

## Connecting real WhatsApp (Twilio Sandbox)

1. In the [Twilio console](https://console.twilio.com) open **Messaging →
   Try it out → WhatsApp sandbox**; join by sending the given code to the
   sandbox number.
2. Expose the backend: `ngrok http 3001` (or cloudflared).
3. Set the sandbox **"When a message comes in"** webhook to
   `https://<your-ngrok>.ngrok.app/webhooks/whatsapp` (HTTP POST).
4. Put `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
   (e.g. `whatsapp:+14155238886`) in `server/.env` and restart.
5. Text or send a voice note from your joined number — the shop is auto-created
   on first message; register the same number at `/login` to see its dashboard.

## Try these messages (simulator or WhatsApp)

| Message | What happens |
|---|---|
| `2 kg rice 100 rupees cash` | logs a cash sale |
| `Ramesh 3 kg sugar 150 udhaar` | logs a credit sale to Ramesh |
| `Ramesh paid 50` | records a repayment |
| `aaj ka profit kitna hua` | today's profit |
| `kitne paise aaye aaj` | money received today |
| `kaun kaun ka udhaar baaki hai` | outstanding dues |
| `ఈ రోజు అమ్మకాలు ఎంత` | today's sales (Telugu) |

## Backend pipeline smoke test (no keys needed)

```bash
npm --prefix server run test:pipeline
```

## Tech
React 19 · Vite · Tailwind v4 · Framer Motion · Recharts · react-i18next ·
Express 5 · better-sqlite3 · @anthropic-ai/sdk (Claude) · Sarvam AI · Twilio.

## Notes
- PIN login is lightweight demo auth (bcrypt-hashed), not production identity.
- When product cost is unknown, a 20% margin is assumed so demo profit is
  realistic; a `restock` with a price sets the true cost.
- Team names in the marketing page are placeholders — edit
  `src/components/TeamCTA.jsx`.
