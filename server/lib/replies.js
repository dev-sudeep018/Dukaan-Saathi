/* Deterministic, localized reply builder. Numbers come straight from the DB
   result (never hallucinated); only the wording is per-language. Supported
   languages: en (English), hi (Hindi), te (Telugu). Falls back to en. */

const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const qtyUnit = (q, u) => `${+Number(q).toFixed(2)}${u && u !== "unit" ? " " + u : ""}`;
/* Localized noun for the undone entry type (sale | expense | payment). */
const undoWord = (type, lang) =>
  ({
    hi: { sale: "बिक्री", expense: "खर्च", payment: "भुगतान" },
    te: { sale: "అమ్మకం", expense: "ఖర్చు", payment: "చెల్లింపు" },
  }[lang]?.[type] || type);

/* Each template is a function(data) => string, grouped by intent then language. */
const T = {
  onboarding: {
    en: () =>
      "👋 Namaste! I'm Dukaan Saathi. Just tell me your sales, udhaar or stock by text or voice — in English, Hindi or Telugu. Try: \"2 kg rice 100 rupees cash\".",
    hi: () =>
      "👋 नमस्ते! मैं दुकान साथी हूँ। अपनी बिक्री, उधार या स्टॉक बस बोलकर या लिखकर बताइए — हिंदी, अंग्रेज़ी या तेलुगु में। जैसे: \"2 किलो चावल 100 रुपये नकद\"।",
    te: () =>
      "👋 నమస్తే! నేను దుకాన్ సాథి. మీ అమ్మకాలు, ఉధార్ లేదా స్టాక్‌ను టెక్స్ట్ లేదా వాయిస్‌తో చెప్పండి — తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో. ఉదా: \"2 కిలో బియ్యం 100 రూపాయలు నగదు\".",
  },

  sale_logged: {
    en: (d) =>
      `✅ Sale logged: ${qtyUnit(d.qty, d.unit)} ${d.item} → ${money(d.amount)}` +
      (d.payment_type === "udhaar"
        ? ` on ${d.party}'s udhaar. Total due: ${money(d.newDue)}.`
        : " (cash)."),
    hi: (d) =>
      `✅ बिक्री दर्ज: ${qtyUnit(d.qty, d.unit)} ${d.item} → ${money(d.amount)}` +
      (d.payment_type === "udhaar"
        ? `, ${d.party} के उधार में जुड़ा। कुल बकाया: ${money(d.newDue)}।`
        : " (नकद)।"),
    te: (d) =>
      `✅ అమ్మకం నమోదైంది: ${qtyUnit(d.qty, d.unit)} ${d.item} → ${money(d.amount)}` +
      (d.payment_type === "udhaar"
        ? `, ${d.party} ఉధార్‌లో చేర్చబడింది. మొత్తం బాకీ: ${money(d.newDue)}.`
        : " (నగదు)."),
  },

  restocked: {
    en: (d) =>
      `📦 Stock updated: added ${qtyUnit(d.qty, d.unit)} ${d.item}. Now in stock: ${qtyUnit(d.newStock, d.unit)}.`,
    hi: (d) =>
      `📦 स्टॉक अपडेट: ${qtyUnit(d.qty, d.unit)} ${d.item} जोड़ा। अब स्टॉक में: ${qtyUnit(d.newStock, d.unit)}।`,
    te: (d) =>
      `📦 స్టాక్ నవీకరించబడింది: ${qtyUnit(d.qty, d.unit)} ${d.item} చేర్చబడింది. ఇప్పుడు స్టాక్‌లో: ${qtyUnit(d.newStock, d.unit)}.`,
  },

  payment_recorded: {
    en: (d) =>
      `🧾 Got it. ${d.party} paid ${money(d.amount)}. Remaining due: ${money(d.remaining)}.`,
    hi: (d) =>
      `🧾 ठीक है। ${d.party} ने ${money(d.amount)} चुकाए। बाकी बकाया: ${money(d.remaining)}।`,
    te: (d) =>
      `🧾 సరే. ${d.party} ${money(d.amount)} చెల్లించారు. మిగిలిన బాకీ: ${money(d.remaining)}.`,
  },

  product_added: {
    en: (d) => `🆕 Added "${d.item}" to your products.`,
    hi: (d) => `🆕 "${d.item}" आपके प्रोडक्ट में जुड़ गया।`,
    te: (d) => `🆕 "${d.item}" మీ ఉత్పత్తులలో చేర్చబడింది.`,
  },

  profit_report: {
    en: (d) =>
      `📈 Today's net profit: ${money(d.netProfit)}\nSales ${money(d.revenue)} · ${d.orders} orders\nGross ${money(d.profit)} − expenses ${money(d.expenses)}.`,
    hi: (d) =>
      `📈 आज का शुद्ध मुनाफ़ा: ${money(d.netProfit)}\nबिक्री ${money(d.revenue)} · ${d.orders} ऑर्डर\nसकल ${money(d.profit)} − खर्च ${money(d.expenses)}।`,
    te: (d) =>
      `📈 ఈ రోజు నికర లాభం: ${money(d.netProfit)}\nఅమ్మకాలు ${money(d.revenue)} · ${d.orders} ఆర్డర్లు\nస్థూల ${money(d.profit)} − ఖర్చులు ${money(d.expenses)}.`,
  },

  expense_logged: {
    en: (d) =>
      `🧾 Expense noted: ${money(d.amount)} for ${d.category}. Today's expenses: ${money(d.totalToday)}. Net profit now: ${money(d.netProfit)}.`,
    hi: (d) =>
      `🧾 खर्च दर्ज: ${d.category} के लिए ${money(d.amount)}। आज का कुल खर्च: ${money(d.totalToday)}। अब शुद्ध मुनाफ़ा: ${money(d.netProfit)}।`,
    te: (d) =>
      `🧾 ఖర్చు నమోదైంది: ${d.category} కోసం ${money(d.amount)}. ఈ రోజు ఖర్చులు: ${money(d.totalToday)}. ఇప్పుడు నికర లాభం: ${money(d.netProfit)}.`,
  },

  expenses_report: {
    en: (d) =>
      d.total <= 0
        ? "🧾 No expenses recorded today."
        : `🧾 Today's expenses: ${money(d.total)} across ${d.items.length} entr${d.items.length === 1 ? "y" : "ies"}.\n` +
          d.items.slice(0, 5).map((e) => `• ${e.category} — ${money(e.amount)}`).join("\n"),
    hi: (d) =>
      d.total <= 0
        ? "🧾 आज कोई खर्च दर्ज नहीं हुआ।"
        : `🧾 आज का खर्च: ${money(d.total)}, ${d.items.length} मद।\n` +
          d.items.slice(0, 5).map((e) => `• ${e.category} — ${money(e.amount)}`).join("\n"),
    te: (d) =>
      d.total <= 0
        ? "🧾 ఈ రోజు ఖర్చులు నమోదు కాలేదు."
        : `🧾 ఈ రోజు ఖర్చులు: ${money(d.total)}, ${d.items.length} నమోదులు.\n` +
          d.items.slice(0, 5).map((e) => `• ${e.category} — ${money(e.amount)}`).join("\n"),
  },

  undone: {
    en: (d) => `↩️ Removed the last ${d.type}: ${d.description}.`,
    hi: (d) => `↩️ आख़िरी ${undoWord(d.type, "hi")} हटा दिया: ${d.description}।`,
    te: (d) => `↩️ చివరి ${undoWord(d.type, "te")} తీసివేయబడింది: ${d.description}.`,
  },

  nothing_to_undo: {
    en: () => "🤷 There's nothing recent to undo.",
    hi: () => "🤷 हटाने के लिए कुछ हाल का नहीं है।",
    te: () => "🤷 రద్దు చేయడానికి ఇటీవల ఏదీ లేదు.",
  },

  day_report: {
    en: (d) =>
      `📊 Today's report\n` +
      `• Sales: ${money(d.revenue)} (${d.orders} orders)\n` +
      `• Expenses: ${money(d.expenses)}\n` +
      `• Net profit: ${money(d.netProfit)}\n` +
      `• Money received: ${money(d.moneyReceived)}\n` +
      `• Udhaar pending: ${money(d.duesTotal)} (${d.duesCount})` +
      (d.best ? `\n• Top seller: ${d.best.topSeller.item}` : "") +
      (d.lowStock.length ? `\n• Low stock: ${d.lowStock.slice(0, 3).map((p) => p.name).join(", ")}` : ""),
    hi: (d) =>
      `📊 आज का हिसाब\n` +
      `• बिक्री: ${money(d.revenue)} (${d.orders} ऑर्डर)\n` +
      `• खर्च: ${money(d.expenses)}\n` +
      `• शुद्ध मुनाफ़ा: ${money(d.netProfit)}\n` +
      `• मिले पैसे: ${money(d.moneyReceived)}\n` +
      `• बकाया उधार: ${money(d.duesTotal)} (${d.duesCount})` +
      (d.best ? `\n• सबसे ज़्यादा बिका: ${d.best.topSeller.item}` : "") +
      (d.lowStock.length ? `\n• कम स्टॉक: ${d.lowStock.slice(0, 3).map((p) => p.name).join(", ")}` : ""),
    te: (d) =>
      `📊 ఈ రోజు హిసాబు\n` +
      `• అమ్మకాలు: ${money(d.revenue)} (${d.orders} ఆర్డర్లు)\n` +
      `• ఖర్చులు: ${money(d.expenses)}\n` +
      `• నికర లాభం: ${money(d.netProfit)}\n` +
      `• వచ్చిన డబ్బు: ${money(d.moneyReceived)}\n` +
      `• బాకీ ఉధార్: ${money(d.duesTotal)} (${d.duesCount})` +
      (d.best ? `\n• టాప్ సెల్లర్: ${d.best.topSeller.item}` : "") +
      (d.lowStock.length ? `\n• తక్కువ స్టాక్: ${d.lowStock.slice(0, 3).map((p) => p.name).join(", ")}` : ""),
  },

  money_today: {
    en: (d) =>
      `💰 Money received today: ${money(d.moneyReceived)}\n(cash sales + udhaar repaid).`,
    hi: (d) =>
      `💰 आज मिले पैसे: ${money(d.moneyReceived)}\n(नकद बिक्री + उधार वापसी)।`,
    te: (d) =>
      `💰 ఈ రోజు వచ్చిన డబ్బు: ${money(d.moneyReceived)}\n(నగదు అమ్మకాలు + ఉధార్ తిరిగి చెల్లింపు).`,
  },

  dues_report: {
    en: (d) =>
      d.total <= 0
        ? "🎉 No udhaar pending. All clear!"
        : `🧾 Total udhaar: ${money(d.total)} across ${d.customers.length} customer(s).\n` +
          d.customers.slice(0, 5).map((c) => `• ${c.name} — ${money(c.outstanding)}`).join("\n"),
    hi: (d) =>
      d.total <= 0
        ? "🎉 कोई उधार बाकी नहीं। सब क्लियर!"
        : `🧾 कुल उधार: ${money(d.total)}, ${d.customers.length} ग्राहक।\n` +
          d.customers.slice(0, 5).map((c) => `• ${c.name} — ${money(c.outstanding)}`).join("\n"),
    te: (d) =>
      d.total <= 0
        ? "🎉 ఏ ఉధార్ బాకీ లేదు. అంతా క్లియర్!"
        : `🧾 మొత్తం ఉధార్: ${money(d.total)}, ${d.customers.length} వినియోగదారులు.\n` +
          d.customers.slice(0, 5).map((c) => `• ${c.name} — ${money(c.outstanding)}`).join("\n"),
  },

  stock_report: {
    en: (d) =>
      d.items.length === 0
        ? "✅ Nothing is running low right now."
        : `⚠️ Running low:\n` +
          d.items.map((p) => `• ${p.name} — ${qtyUnit(p.stock_qty, p.unit)} left`).join("\n"),
    hi: (d) =>
      d.items.length === 0
        ? "✅ अभी कुछ भी कम नहीं है।"
        : `⚠️ कम हो रहा है:\n` +
          d.items.map((p) => `• ${p.name} — ${qtyUnit(p.stock_qty, p.unit)} बचा`).join("\n"),
    te: (d) =>
      d.items.length === 0
        ? "✅ ఇప్పుడు ఏదీ తక్కువగా లేదు."
        : `⚠️ తక్కువగా ఉన్నవి:\n` +
          d.items.map((p) => `• ${p.name} — ${qtyUnit(p.stock_qty, p.unit)} మిగిలి`).join("\n"),
  },

  sales_report: {
    en: (d) =>
      `🧮 Today: ${d.orders} sale(s), ${money(d.revenue)} total.`,
    hi: (d) => `🧮 आज: ${d.orders} बिक्री, कुल ${money(d.revenue)}।`,
    te: (d) => `🧮 ఈ రోజు: ${d.orders} అమ్మకాలు, మొత్తం ${money(d.revenue)}.`,
  },

  need_customer: {
    en: () => "Whose udhaar is this? Please tell me the customer's name.",
    hi: () => "यह किसका उधार है? कृपया ग्राहक का नाम बताइए।",
    te: () => "ఇది ఎవరి ఉధార్? దయచేసి వినియోగదారు పేరు చెప్పండి.",
  },

  not_understood: {
    en: () =>
      "🤔 I didn't quite catch that. Try: \"2 kg sugar 90 rupees cash\", \"Ramesh paid 200\", or \"today's profit?\"",
    hi: () =>
      "🤔 मैं ठीक से समझ नहीं पाया। ऐसे कहिए: \"2 किलो चीनी 90 रुपये नकद\", \"रमेश ने 200 दिए\", या \"आज का मुनाफ़ा?\"",
    te: () =>
      "🤔 నాకు సరిగ్గా అర్థం కాలేదు. ఇలా చెప్పండి: \"2 కిలో చక్కెర 90 రూపాయలు నగదు\", \"రమేష్ 200 చెల్లించారు\", లేదా \"ఈ రోజు లాభం?\"",
  },

  voice_disabled: {
    en: () =>
      "🎙️ Voice notes aren't enabled yet (Sarvam key not set). Please type your message for now.",
    hi: () =>
      "🎙️ वॉइस नोट अभी चालू नहीं है। कृपया अभी संदेश टाइप करें।",
    te: () =>
      "🎙️ వాయిస్ నోట్స్ ఇంకా ప్రారంభించబడలేదు. దయచేసి ప్రస్తుతం టైప్ చేయండి.",
  },

  error: {
    en: () => "⚠️ Something went wrong on my side. Please try again.",
    hi: () => "⚠️ मेरी तरफ़ कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।",
    te: () => "⚠️ నా వైపు ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
  },
};

export function compose(key, lang, data = {}) {
  const group = T[key] || T.not_understood;
  const fn = group[lang] || group.en;
  return fn(data);
}
