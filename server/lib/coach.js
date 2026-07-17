import OpenAI from "openai";
import { config, flags } from "../config.js";

/* The "advisor" half of the hybrid reply strategy.

   Action confirmations (sale logged, restock, payment) stay 100% deterministic
   in replies.js — fast, reliable, never wrong. For open-ended asks (a day
   report, "why did profit change"), we optionally let the LLM add ONE short,
   plain-language insight — but only grounded in the numbers we pass it. If the
   key is missing or the call fails, we return "" and the deterministic report
   stands on its own. The demo never depends on this.

   Guardrails baked into the prompt: never invent numbers, hedge with "based on
   today's data / likely", one or two sentences, warm and practical. */

const client = () =>
  new OpenAI({
    baseURL: config.nvidia.baseUrl,
    apiKey: config.nvidia.apiKey,
    timeout: 6000,
    maxRetries: 0,
  });

const LANG_NAME = { en: "English", hi: "Hindi", te: "Telugu" };

const SYSTEM = `You are Dukaan Saathi, a warm, practical AI business partner for a small Indian kirana (grocery) shop owner.
You will be given the shop's real numbers for today as JSON. Write ONE or TWO short sentences of genuinely useful, encouraging insight based ONLY on those numbers.
Rules:
- NEVER invent numbers, product names, or facts that are not in the data.
- When you suggest a reason or trend, hedge honestly: "Based on today's numbers…", "This suggests…", "You may want to…".
- Be warm and human, like a trusted friend who runs shops — not a robot, not corporate.
- No greetings, no headings, no bullet points. Just the insight sentence(s).
- Reply in the requested language.`;

/* Returns a short grounded insight string, or "" when unavailable. */
export async function coachInsight(kind, data, lang = "en") {
  if (!flags.hasNvidia) return "";
  try {
    const msg = await client().chat.completions.create({
      model: config.nvidia.model,
      max_tokens: 160,
      temperature: config.nvidia.temperature,
      top_p: config.nvidia.topP,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Language: ${LANG_NAME[lang] || "English"}\n` +
            `Insight type: ${kind}\n` +
            `Shop data (JSON): ${JSON.stringify(data)}\n\n` +
            `Give one short, grounded insight for the shopkeeper.`,
        },
      ],
      ...config.nvidia.extraBody,
    });
    const text = (msg.choices[0]?.message?.content || "").trim();
    return text;
  } catch (err) {
    console.error("[coach] insight failed, skipping:", err.message);
    return "";
  }
}
