import { db } from "../db.js";
import { parse } from "./parser.js";
import { executeIntent } from "./intents.js";
import { compose } from "./replies.js";

/* The heart of Dukaan Saathi. Same logic for WhatsApp and the web simulator.
   `text` is the final text (already transcribed if it came from a voice note). */
export async function handleMessage({ shop, text, channel = "sim", transcript = null }) {
  const content = (text || "").trim();

  if (!content) {
    const reply = compose("not_understood", shop.lang_pref || "en", {});
    return { reply, intent: "unknown", language: shop.lang_pref || "en", transcript };
  }

  let parsed;
  try {
    parsed = await parse(content, { lang: shop.lang_pref });
  } catch (err) {
    console.error("[pipeline] parse failed:", err.message);
    const reply = compose("error", shop.lang_pref || "en", {});
    return { reply, intent: "unknown", language: shop.lang_pref || "en", transcript };
  }

  const lang = parsed.language || shop.lang_pref || "en";

  // log inbound
  await logMessage(shop.id, "in", channel, content, transcript, lang, parsed.intent, parsed);

  let result;
  try {
    result = await executeIntent(parsed, shop);
  } catch (err) {
    console.error("[pipeline] intent execution failed:", err.message);
    result = { replyKey: "error", data: {} };
  }

  // remember the language the shopkeeper used
  if (["en", "hi", "te"].includes(lang) && lang !== shop.lang_pref) {
    await db.prepare("UPDATE shops SET lang_pref = ? WHERE id = ?").run(lang, shop.id);
  }

  const reply = compose(result.replyKey, lang, result.data);
  await logMessage(shop.id, "out", channel, reply, null, lang, result.replyKey, result.data);

  return { reply, intent: parsed.intent, language: lang, parsed, result, transcript };
}

async function logMessage(shopId, direction, channel, raw, transcript, lang, intent, parsed) {
  try {
    await db.prepare(
      `INSERT INTO messages (shop_id, direction, channel, raw_text, transcript, lang, intent, parsed_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(shopId, direction, channel, raw, transcript, lang, intent, JSON.stringify(parsed || {}));
  } catch (err) {
    console.error("[pipeline] log failed:", err.message);
  }
}
