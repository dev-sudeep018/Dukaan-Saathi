import Anthropic from "@anthropic-ai/sdk";
import { config, flags } from "../config.js";

/* The structured shape every parse returns. */
const INTENTS = [
  "log_sale",
  "restock",
  "record_payment",
  "record_expense",
  "add_product",
  "query_profit",
  "query_money_today",
  "query_expenses",
  "query_dues",
  "query_stock",
  "query_sales",
  "day_report",
  "undo_last",
  "help",
  "unknown",
];

const EXTRACT_TOOL = {
  name: "record_shop_action",
  description:
    "Extract the shopkeeper's intent and any entities from their message. " +
    "The message may be in English, Hindi, Hinglish (Roman Hindi) or Telugu.",
  input_schema: {
    type: "object",
    properties: {
      intent: { type: "string", enum: INTENTS },
      language: {
        type: "string",
        enum: ["en", "hi", "te"],
        description: "Language the shopkeeper wrote/spoke in.",
      },
      item: { type: "string", description: "Product name, if any (English or transliterated)." },
      qty: { type: "number", description: "Quantity, if stated." },
      unit: { type: "string", description: "Unit like kg, g, l, ml, packet, piece. Default 'unit'." },
      unit_price: { type: "number", description: "Price per unit, if stated." },
      amount: { type: "number", description: "Total money amount in rupees, if stated." },
      party_name: { type: "string", description: "Customer/person name for udhaar or a repayment." },
      category: { type: "string", description: "For record_expense: what the money was spent on, e.g. rent, transport, electricity, tea, supplies." },
      payment_type: {
        type: "string",
        enum: ["cash", "udhaar"],
        description: "cash if paid now; udhaar if on credit/borrowed.",
      },
      confidence: { type: "number", description: "0 to 1 confidence in this parse." },
    },
    required: ["intent", "language"],
  },
};

const SYSTEM = `You are the parsing brain of "Dukaan Saathi", a WhatsApp assistant for small Indian kirana shop owners.
Shopkeepers message you in English, Hindi, Hinglish (Hindi in Roman letters) or Telugu, by text or transcribed voice.
Extract exactly one intent plus entities and call the tool.

Guidance:
- "2 kg rice 100 rupees cash" / "2 किलो चावल 100 रुपये" / "2 కిలో బియ్యం 100 రూపాయలు" => log_sale, qty 2, unit kg, item rice, amount 100, payment_type cash.
- If a person's name + "udhaar/उधार/ఉధార్/credit/baaki" appears with a sale => log_sale with payment_type udhaar and party_name.
- "<name> paid 200" / "रमेश ने 200 दिए" / "రమేష్ 200 చెల్లించారు" => record_payment, party_name, amount.
- "10 kg sugar aaya/restock/bought/kharida" => restock.
- A cost the shop PAID OUT that is not stock — rent, electricity, transport, tea, salary, misc — e.g. "rent 5000 / bijli bill 800 / chai 40 kharch / bhada 200 / అద్దె 5000 ఖర్చు" => record_expense with amount and a short category. (Buying stock to sell is restock, NOT an expense.)
- Questions like "today's profit / aaj ka munafa / ఈ రోజు లాభం" => query_profit.
- "how much money came today / kitne paise aaye / ఈ రోజు ఎంత డబ్బు" => query_money_today.
- "how much did I spend today / aaj kitna kharch hua / ఈ రోజు ఎంత ఖర్చు" => query_expenses.
- "who owes me / kaun kaun ka udhaar / ఎవరు బాకీ" => query_dues.
- "what's low / kya khatam / తక్కువగా ఏమి ఉంది" => query_stock.
- "today's sales / aaj ki bikri" => query_sales.
- A full end-of-day summary: "day report / aaj ka hisab / poora hisab / ఈ రోజు హిసాబు / రిపోర్ట్" => day_report.
- Cancel/undo the last thing entered: "undo / galti / galat / cancel / mistake / రద్దు / గల్తీ" => undo_last.
- Greetings/help => help. If unclear => unknown.
Always set language to what the user actually used. Normalize item names to a simple lowercase noun. Infer amount = qty*unit_price when only per-unit price is given.`;

let client = null;
function getClient() {
  if (!client)
    client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      timeout: 8000, // fail fast (8s) to the mock parser instead of stalling a message
      maxRetries: 1, // one quick retry; the catch below degrades to mockParse
    });
  return client;
}

export async function parse(text, shopContext = {}) {
  const clean = (text || "").trim();
  if (!clean) return { intent: "unknown", language: shopContext.lang || "en", confidence: 0 };

  if (!flags.hasClaude) return mockParse(clean, shopContext);

  try {
    const msg = await getClient().messages.create({
      model: config.anthropic.model,
      max_tokens: 400,
      system: SYSTEM,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [{ role: "user", content: clean }],
    });
    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block) return mockParse(clean, shopContext);
    return normalizeParsed(block.input, clean, shopContext);
  } catch (err) {
    console.error("[parser] Claude call failed, using mock:", err.message);
    return mockParse(clean, shopContext);
  }
}

function normalizeParsed(p, text, ctx) {
  return {
    intent: INTENTS.includes(p.intent) ? p.intent : "unknown",
    language: ["en", "hi", "te"].includes(p.language) ? p.language : detectLang(text) || ctx.lang || "en",
    item: p.item ? String(p.item).toLowerCase().trim() : null,
    qty: numeric(p.qty),
    unit: p.unit ? String(p.unit).toLowerCase().trim() : "unit",
    unit_price: numeric(p.unit_price),
    amount: numeric(p.amount),
    party_name: p.party_name ? String(p.party_name).trim() : null,
    category: p.category ? String(p.category).toLowerCase().trim() : null,
    payment_type: p.payment_type === "udhaar" ? "udhaar" : p.payment_type === "cash" ? "cash" : null,
    confidence: numeric(p.confidence) ?? 0.75,
    _raw: text,
  };
}

const numeric = (v) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v));

/* ---- Language detection by script ---------------------------------------- */
export function detectLang(text) {
  if (/[ఀ-౿]/.test(text)) return "te"; // Telugu block
  if (/[ऀ-ॿ]/.test(text)) return "hi"; // Devanagari block
  return "en";
}

/* ---- Rule-based fallback parser (runs when no Anthropic key) -------------- */
const KW = {
  profit: ["profit", "munafa", "munaafa", "faayda", "fayda", "मुनाफ़ा", "मुनाफा", "फायदा", "లాభం", "లాభo"],
  money: ["money", "paise", "paisa", "collection", "kitna aaya", "kitne aaye", "पैसे", "पैसा", "కलెక्షन్", "డబ్బు", "సొమ్ము"],
  dues: ["udhaar", "udhar", "owe", "owes", "baaki", "baki", "उधार", "बकाया", "కాన", "ఉధార్", "బాకీ"],
  // Question words that mean "show me the dues" — as opposed to "udhaar" alone,
  // which is also the marker on a credit *sale*. Used to tell the two apart.
  duesQ: ["owe", "owes", "who", "kaun", "kis", "kiska", "list", "outstanding", "pending", "baaki", "baki", "बाकी", "बकाया", "कौन", "किसका", "किस", "ఎవరు", "ఎవరి", "బాకీ", "బకాయి"],
  stock: ["stock", "low", "khatam", "khtm", "kam ho", "running low", "खतम", "कम", "స్టాక్", "తక్కువ", "అయిపో"],
  sales: ["sales", "bikri", "bikree", "बिक्री", "అమ్మకాలు", "సేల్స్"],
  paid: ["paid", "diye", "de diye", "chukaya", "chukaye", "wapas", "returned", "चुकाया", "दिए", "వాపస్", "చెల్లించ", "కట్ట"],
  restock: ["restock", "aaya", "aaye", "purchase", "kharida", "bought", "khareeda", "आया", "खरीदा", "కొన", "వచ్చింది"],
  expense: ["kharch", "kharcha", "kharche", "expense", "spent", "rent", "bhada", "bhaada", "kiraya", "bill", "bijli", "salary", "chai", "खर्च", "खर्चा", "किराया", "भाड़ा", "बिजली", "बिल", "ఖర్చు", "అద్దె", "బిల్లు", "జీతం"],
  expenseQ: ["kitna kharch", "kharch kitna", "kharcha kitna", "expenses", "how much spent", "total kharch", "कितना खर्च", "खर्च कितना", "ఎంత ఖర్చు", "ఖర్చు ఎంత"],
  undo: ["undo", "galti", "galat", "cancel", "mistake", "delete last", "hatao", "गलती", "गलत", "रद्द", "हटाओ", "రద్దు", "గల్తీ", "తప్పు"],
  report: ["hisab", "hisaab", "day report", "full report", "summary", "poora hisab", "din ka hisab", "हिसाब", "पूरा हिसाब", "रिपोर्ट", "हिसाब किताब", "హిసాబు", "రిపోర్ట్", "పూర్తి"],
  help: ["help", "hi", "hello", "namaste", "namaskar", "start", "నమస్తే", "నమస్కారం", "నమస్తే"],
};
const has = (t, list) => list.some((k) => t.includes(k));

function mockParse(text, ctx) {
  const t = text.toLowerCase();
  const language = detectLang(text) || ctx.lang || "en";
  const base = { language, item: null, qty: null, unit: "unit", unit_price: null, amount: null, party_name: null, payment_type: null, confidence: 0.5, _raw: text };

  const numbers = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const unitMatch = t.match(/\b(kg|kgs|kilo|g|gram|grams|l|ltr|litre|liter|ml|packet|pkt|piece|pcs|dozen)\b/);
  const unit = unitMatch ? unitMatch[1] : "unit";
  const party = extractName(text);

  // control / report intents first — they need no amount
  if (has(t, KW.undo)) return { ...base, intent: "undo_last" };
  if (has(t, KW.report)) return { ...base, intent: "day_report" };

  if (has(t, KW.paid) && numbers.length)
    return { ...base, intent: "record_payment", party_name: party, amount: Math.max(...numbers) };

  // A credit SALE — the "udhaar" marker plus an amount/quantity (optionally a
  // name): "Ramesh 3 kg sugar 150 udhaar", "Suresh ko 2 kg dal 120 udhaar".
  // Must be caught before the dues *question* below, since both mention udhaar.
  const looksLikeSale = numbers.length >= 1 && (Boolean(unitMatch) || numbers.length >= 2 || Boolean(party));
  if (has(t, KW.dues) && !has(t, KW.duesQ) && looksLikeSale) {
    const qty = numbers.length >= 2 ? numbers[0] : unitMatch ? numbers[0] : 1;
    const amount = numbers.length >= 2 ? numbers[numbers.length - 1] : numbers[0];
    return {
      ...base,
      intent: "log_sale",
      item: guessItem(text, party) || "item",
      qty,
      unit,
      amount,
      party_name: party,
      payment_type: "udhaar",
    };
  }

  // an explicit expenses question, or an expense word with no amount, is a query;
  // an expense word WITH an amount records the expense.
  if (has(t, KW.expenseQ) || (has(t, KW.expense) && !numbers.length))
    return { ...base, intent: "query_expenses" };
  if (has(t, KW.expense) && numbers.length)
    return { ...base, intent: "record_expense", amount: Math.max(...numbers), category: guessItem(text, party) };

  if (has(t, KW.profit)) return { ...base, intent: "query_profit" };
  if (has(t, KW.money)) return { ...base, intent: "query_money_today" };
  // A dues *question*: explicit question words, or a bare "udhaar?" with no amount.
  if (has(t, KW.duesQ) || (has(t, KW.dues) && !numbers.length))
    return { ...base, intent: "query_dues" };
  if (has(t, KW.stock)) return { ...base, intent: "query_stock" };
  if (has(t, KW.sales)) return { ...base, intent: "query_sales" };
  if (has(t, KW.restock) && numbers.length)
    return { ...base, intent: "restock", item: guessItem(text, party), qty: numbers[0], unit };

  // sale: has a quantity and/or an amount + an item
  if (numbers.length) {
    const udhaar = has(t, KW.dues) || Boolean(party);
    const qty = numbers.length >= 2 ? numbers[0] : unitMatch ? numbers[0] : 1;
    const amount = numbers.length >= 2 ? numbers[numbers.length - 1] : numbers[0];
    return {
      ...base,
      intent: "log_sale",
      item: guessItem(text, party) || "item",
      qty,
      unit,
      amount,
      party_name: udhaar ? party : null,
      payment_type: udhaar ? "udhaar" : "cash",
    };
  }

  if (has(t, KW.help)) return { ...base, intent: "help" };
  return { ...base, intent: "unknown" };
}

/* crude helpers for the fallback only */
function guessItem(text, exclude = null) {
  const stop = new Set(["kg","kgs","kilo","g","gram","grams","l","ltr","litre","liter","ml","packet","pkt","piece","pcs","dozen","rupees","rupaye","rupee","rs","cash","udhaar","udhar","ko","ka","ke","ki","aaya","aaye","diye","paid","for","to","and","का","के","को","रुपये","नकद","उधार"]);
  if (exclude) stop.add(exclude.toLowerCase());
  const words = text
    .replace(/\d+(?:\.\d+)?/g, " ")
    .replace(/[₹.,!?]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()) && !/^\d+$/.test(w));
  return words.length ? words.slice(0, 2).join(" ").toLowerCase() : null;
}

function extractName(text) {
  // Roman "<Name> ko ..." or "<Name> ne ..." or "<Name> paid"
  const m = text.match(/\b([A-Z][a-z]{2,})\b(?=.*\b(ko|ne|ka|udhaar|udhar|paid|owes)\b)/);
  return m ? m[1] : null;
}
