import { db } from "../db.js";
import { flags } from "../config.js";
import { parse } from "./parser.js";
import { executeIntent } from "./intents.js";
import { compose } from "./replies.js";
import { coachInsight } from "./coach.js";

/* Intents where a short LLM-written insight (grounded in the data) meaningfully
   enriches the deterministic report. Everything else stays template-only. */
const COACHABLE = { day_report: "day_report", query_profit: "profit" };

/* Whether the live LLM is answering, or the offline rule-based fallback.
   Surfaced to the UI so it can show an honest "Live AI" / "Demo AI Mode" badge
   rather than silently pretending the regex parser is the AI. */
const aiMode = () => (flags.hasNvidia ? "live" : "demo");

/* The heart of Dukaan Saathi — turns a natural-language message into a ledger
   update + a reply. `text` is the final text (already transcribed if it came
   from a voice note). */
export async function handleMessage({ shop, text, channel = "ai", transcript = null }) {
  const content = (text || "").trim();

  if (!content) {
    const reply = compose("not_understood", shop.lang_pref || "en", {});
    return { reply, intent: "unknown", language: shop.lang_pref || "en", transcript, aiMode: aiMode() };
  }

  let parsed;
  try {
    parsed = await parse(content, { lang: shop.lang_pref });
  } catch (err) {
    console.error("[pipeline] parse failed:", err.message);
    const reply = compose("error", shop.lang_pref || "en", {});
    return { reply, intent: "unknown", language: shop.lang_pref || "en", transcript, aiMode: aiMode() };
  }

  const lang = parsed.language || shop.lang_pref || "en";

  // log inbound
  await logMessage(shop.id, "in", channel, content, transcript, lang, parsed.intent, parsed);

  // Chat-only responses (casual conversation, no shop action) bypass intent execution
  if (parsed.intent === "chat") {
    const reply = parsed._reply || compose("not_understood", lang, {});
    await logMessage(shop.id, "out", channel, reply, null, lang, "chat", parsed);
    return { reply, intent: "chat", language: lang, parsed, result: null, transcript, aiMode: aiMode() };
  }

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

  let reply = compose(result.replyKey, lang, result.data);

  // Hybrid: for reports, let the live LLM add one grounded advisor sentence on
  // top of the deterministic report. No-op (empty) in Demo Mode or on failure.
  if (COACHABLE[parsed.intent]) {
    const insight = await coachInsight(COACHABLE[parsed.intent], result.data, lang);
    if (insight) reply += `\n\n💡 ${insight}`;
  }

  await logMessage(shop.id, "out", channel, reply, null, lang, result.replyKey, result.data);

  return { reply, intent: parsed.intent, language: lang, parsed, result, transcript, aiMode: aiMode() };
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
