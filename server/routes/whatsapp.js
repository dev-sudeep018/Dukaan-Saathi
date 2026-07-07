import { Router } from "express";
import { getOrCreateShop } from "../db.js";
import { handleMessage } from "../lib/pipeline.js";
import { transcribe } from "../lib/stt.js";
import { downloadTwilioMedia, twiml, validateTwilioSignature } from "../lib/twilio.js";
import { compose } from "../lib/replies.js";
import { flags } from "../config.js";

export const whatsappRouter = Router();

/* Twilio posts application/x-www-form-urlencoded to this webhook. */
whatsappRouter.post("/whatsapp", async (req, res) => {
  const { From, Body } = req.body || {};
  const numMedia = Number(req.body?.NumMedia || 0);
  res.set("Content-Type", "text/xml");

  // Reject spoofed requests when signature validation is enabled. Behind a
  // proxy/tunnel, trust X-Forwarded-* so the reconstructed URL matches Twilio's.
  if (flags.validateTwilioSignature) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const fullUrl = `${proto}://${host}${req.originalUrl}`;
    if (!validateTwilioSignature(req.headers["x-twilio-signature"], fullUrl, req.body || {})) {
      console.warn("[whatsapp] rejected request with invalid Twilio signature");
      return res.status(403).send(twiml("Request could not be verified."));
    }
  }

  if (!From) return res.send(twiml("Sorry, I couldn't identify your number."));

  const shop = await getOrCreateShop(From);
  let text = (Body || "").trim();
  let transcript = null;

  try {
    // Voice note (or any audio media) → transcribe with Sarvam
    if (numMedia > 0) {
      const mediaUrl = req.body.MediaUrl0;
      const mediaType = req.body.MediaContentType0 || "audio/ogg";
      if (mediaType.startsWith("audio")) {
        if (!flags.hasSarvam) {
          return res.send(twiml(compose("voice_disabled", shop.lang_pref || "en", {})));
        }
        const { buffer, contentType } = await downloadTwilioMedia(mediaUrl);
        const stt = await transcribe(buffer, contentType);
        transcript = stt.transcript;
        text = transcript;
      }
    }

    const { reply } = await handleMessage({ shop, text, channel: "whatsapp", transcript });
    return res.send(twiml(reply));
  } catch (err) {
    console.error("[whatsapp] error:", err.message);
    return res.send(twiml(compose("error", shop.lang_pref || "en", {})));
  }
});
