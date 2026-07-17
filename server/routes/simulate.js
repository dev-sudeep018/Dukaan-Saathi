import { Router } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { config, flags } from "../config.js";
import { getOrCreateShop, getShopById } from "../db.js";
import { handleMessage } from "../lib/pipeline.js";
import { executeIntent } from "../lib/intents.js";
import { todaySummary } from "../lib/queries.js";
import { transcribe } from "../lib/stt.js";
import { compose } from "../lib/replies.js";

export const simulateRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DEMO_NUMBER = "+10000000000";

/* Resolve the shop for an AI request:
   1. a valid Bearer token (logged-in shop), else
   2. an explicit `number` in the request, else
   3. a shared demo shop — so anyone can try with zero setup. */
async function resolveShop(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const { shopId } = jwt.verify(header.slice(7), config.jwtSecret);
      const shop = await getShopById(shopId);
      if (shop) return shop;
    } catch {
      /* fall through to number/demo */
    }
  }
  const number = (req.body?.number || "").toString().trim();
  return getOrCreateShop(number || DEMO_NUMBER, "Demo Shop");
}

/* Text (or transcribed voice) → ledger update + reply. */
simulateRouter.post("/message", async (req, res) => {
  try {
    const shop = await resolveShop(req);
    if (req.body?.lang && ["en", "hi", "te"].includes(req.body.lang)) {
      shop.lang_pref = req.body.lang;
    }
    const out = await handleMessage({
      shop,
      text: req.body?.text || "",
      channel: "ai",
    });
    res.json({
      reply: out.reply,
      intent: out.intent,
      language: out.language,
      parsed: out.parsed,
      aiMode: out.aiMode,
    });
  } catch (err) {
    console.error("[ai/message]", err.message);
    res.status(500).json({ error: "Pipeline error" });
  }
});

simulateRouter.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    const shop = await resolveShop(req);
    if (req.body?.lang && ["en", "hi", "te"].includes(req.body.lang)) {
      shop.lang_pref = req.body.lang;
    }
    if (!flags.hasSarvam) {
      return res.json({
        reply: compose("voice_disabled", shop.lang_pref || "en", {}),
        intent: "voice_disabled",
        language: shop.lang_pref || "en",
        transcript: "",
        aiMode: flags.hasNvidia ? "live" : "demo",
      });
    }
    if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

    const stt = await transcribe(req.file.buffer, req.file.mimetype, req.file.originalname || "note.webm");
    const out = await handleMessage({
      shop,
      text: stt.transcript,
      channel: "ai",
      transcript: stt.transcript,
    });
    res.json({
      reply: out.reply,
      transcript: stt.transcript,
      intent: out.intent,
      language: out.language,
      aiMode: out.aiMode,
    });
  } catch (err) {
    console.error("[ai/voice]", err.message);
    res.status(500).json({ error: "Transcription/pipeline error" });
  }
});

/* ---- Notebook scanner ----------------------------------------------------
   Upload a photo of a bahi-khata / udhaar page → get back structured entries
   for the shopkeeper to review, then apply the confirmed ones to the ledger.

   Extraction is a believable demo (deterministic per upload) so the full
   photo → preview → confirm → dashboard loop works without a vision model or
   any keys. Swapping in a real OCR/vision call later only changes extract().  */
simulateRouter.post("/scan", upload.single("image"), async (req, res) => {
  try {
    await resolveShop(req); // validate the request context
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    const entries = extractNotebook(req.file);
    res.json({ ok: true, entries, source: "demo-ocr" });
  } catch (err) {
    console.error("[ai/scan]", err.message);
    res.status(500).json({ error: "Could not read the notebook image" });
  }
});

/* Apply the entries the shopkeeper confirmed in the preview. Each entry is run
   through the SAME executeIntent pipeline as chat + dashboard so stock, udhaar
   and profit stay consistent no matter how it was entered. */
simulateRouter.post("/scan/apply", async (req, res) => {
  try {
    const shop = await resolveShop(req);
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!entries.length) return res.status(400).json({ error: "No entries to apply" });

    let applied = 0;
    for (const e of entries) {
      const amount = Number(e.amount);
      if (!e.item || !(amount > 0)) continue;
      const pay = e.payment_type === "udhaar" ? "udhaar" : "cash";
      if (pay === "udhaar" && !(e.party_name || "").trim()) continue;
      await executeIntent(
        {
          intent: "log_sale",
          item: String(e.item).toLowerCase().trim(),
          qty: Number(e.qty) > 0 ? Number(e.qty) : 1,
          unit: (e.unit || "unit").toString().trim() || "unit",
          unit_price: null,
          amount,
          party_name: pay === "udhaar" ? String(e.party_name).trim() : null,
          payment_type: pay,
          _raw: "notebook-scan",
        },
        shop,
      );
      applied++;
    }
    const summary = await todaySummary(shop.id);
    res.json({ ok: true, applied, summary, aiMode: flags.hasNvidia ? "live" : "demo" });
  } catch (err) {
    console.error("[ai/scan/apply]", err.message);
    res.status(500).json({ error: "Could not save the scanned entries" });
  }
});

/* Believable, varied handwritten-page extraction. Keyed off the uploaded file
   size so the same photo yields the same entries (stable preview), while
   different photos differ. Replace with a real OCR/vision call to go live. */
function extractNotebook(file) {
  const pages = [
    [
      { item: "rice", qty: 2, unit: "kg", amount: 120, party_name: "Ramesh", payment_type: "udhaar" },
      { item: "sugar", qty: 1, unit: "kg", amount: 45, party_name: "", payment_type: "cash" },
      { item: "cooking oil", qty: 1, unit: "l", amount: 140, party_name: "Sunita", payment_type: "udhaar" },
      { item: "tea", qty: 2, unit: "packet", amount: 120, party_name: "", payment_type: "cash" },
    ],
    [
      { item: "wheat flour", qty: 5, unit: "kg", amount: 210, party_name: "Imran", payment_type: "udhaar" },
      { item: "milk", qty: 2, unit: "l", amount: 112, party_name: "", payment_type: "cash" },
      { item: "biscuits", qty: 3, unit: "packet", amount: 90, party_name: "", payment_type: "cash" },
      { item: "toor dal", qty: 1, unit: "kg", amount: 120, party_name: "Lakshmi", payment_type: "udhaar" },
    ],
    [
      { item: "salt", qty: 2, unit: "kg", amount: 48, party_name: "", payment_type: "cash" },
      { item: "soap", qty: 4, unit: "piece", amount: 128, party_name: "Ramesh", payment_type: "udhaar" },
      { item: "rice", qty: 3, unit: "kg", amount: 180, party_name: "", payment_type: "cash" },
    ],
  ];
  const idx = (file?.size || 0) % pages.length;
  return pages[idx].map((e, i) => ({ id: i + 1, confidence: 0.9 - i * 0.05, ...e }));
}
