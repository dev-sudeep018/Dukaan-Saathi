import crypto from "node:crypto";
import { config } from "../config.js";

/* Validate Twilio's X-Twilio-Signature so only genuine Twilio requests can
   drive the webhook (otherwise anyone could POST a spoofed `From` and write to
   any shop). Algorithm per Twilio docs: HMAC-SHA1 of the full request URL with
   every POST param appended (key-sorted, concatenated), keyed by the auth
   token, base64-encoded — compared to the header in constant time. */
export function validateTwilioSignature(signature, url, params = {}) {
  if (!signature || !config.twilio.authToken) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = crypto
    .createHmac("sha1", config.twilio.authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* Download a Twilio media resource (e.g. a WhatsApp voice note).
   Twilio media URLs require HTTP Basic auth with AccountSid:AuthToken. */
export async function downloadTwilioMedia(url) {
  const auth = Buffer.from(
    `${config.twilio.accountSid}:${config.twilio.authToken}`,
  ).toString("base64");
  const resp = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!resp.ok) throw new Error(`Twilio media download ${resp.status}`);
  const contentType = resp.headers.get("content-type") || "audio/ogg";
  const buf = Buffer.from(await resp.arrayBuffer());
  return { buffer: buf, contentType };
}

/* Minimal TwiML for a single WhatsApp reply — avoids pulling in the full SDK. */
export function twiml(message) {
  const safe = String(message)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}
