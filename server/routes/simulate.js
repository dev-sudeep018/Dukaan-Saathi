import { Router } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { config, flags } from "../config.js";
import { getOrCreateShop, getShopById } from "../db.js";
import { handleMessage } from "../lib/pipeline.js";
import { transcribe } from "../lib/stt.js";
import { compose } from "../lib/replies.js";

export const simulateRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DEMO_NUMBER = "+10000000000";

/* Resolve the shop for a simulator request:
   1. a valid Bearer token (logged-in shop), else
   2. an explicit `number` in the request, else
   3. a shared demo shop — so anyone can try with zero setup. */
function resolveShop(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const { shopId } = jwt.verify(header.slice(7), config.jwtSecret);
      const shop = getShopById(shopId);
      if (shop) return shop;
    } catch {
      /* fall through to number/demo */
    }
  }
  const number = (req.body?.number || "").toString().trim();
  return getOrCreateShop(number || DEMO_NUMBER, "Demo Shop");
}

simulateRouter.post("/message", async (req, res) => {
  try {
    const shop = resolveShop(req);
    const out = await handleMessage({
      shop,
      text: req.body?.text || "",
      channel: "sim",
    });
    res.json({ reply: out.reply, intent: out.intent, language: out.language, parsed: out.parsed });
  } catch (err) {
    console.error("[simulate/message]", err.message);
    res.status(500).json({ error: "Pipeline error" });
  }
});

simulateRouter.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    const shop = resolveShop(req);
    if (!flags.hasSarvam) {
      return res.json({
        reply: compose("voice_disabled", shop.lang_pref || "en", {}),
        intent: "voice_disabled",
        language: shop.lang_pref || "en",
        transcript: "",
      });
    }
    if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

    const stt = await transcribe(req.file.buffer, req.file.mimetype, req.file.originalname || "note.webm");
    const out = await handleMessage({
      shop,
      text: stt.transcript,
      channel: "sim",
      transcript: stt.transcript,
    });
    res.json({
      reply: out.reply,
      transcript: stt.transcript,
      intent: out.intent,
      language: out.language,
    });
  } catch (err) {
    console.error("[simulate/voice]", err.message);
    res.status(500).json({ error: "Transcription/pipeline error" });
  }
});
