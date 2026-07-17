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
      "👋 Namaste! I'm Dukaan Saathi, your shop's AI partner. Just talk to me the way you'd tell a helper — a sale, an udhaar, a new stock arrival, or a question like \"how much profit today?\". Voice or text, in English, Hindi or Telugu. Try: \"Sold 2 kg rice for 100 rupees cash\".",
    hi: () =>
      "👋 नमस्ते! मैं दुकान साथी हूँ — आपकी दुकान का AI पार्टनर। जैसे किसी मददगार को बताते हैं, वैसे मुझे बताइए — बिक्री, उधार, नया स्टॉक, या सवाल जैसे \"आज कितना मुनाफ़ा?\"। बोलकर या लिखकर, हिंदी/अंग्रेज़ी/तेलुगु में। जैसे: \"2 किलो चावल 100 रुपये नकद बेचे\"।",
    te: () =>
      "👋 నమస్తే! నేను దుకాన్ సాథి — మీ దుకాణం AI భాగస్వామి. ఒక సహాయకుడికి చెప్పినట్టే నాకు చెప్పండి — అమ్మకం, ఉధార్, కొత్త స్టాక్, లేదా \"ఈ రోజు లాభం ఎంత?\" లాంటి ప్రశ్న. వాయిస్ లేదా టెక్స్ట్, తెలుగు/హిందీ/ఇంగ్లీష్‌లో. ఉదా: \"2 కిలో బియ్యం 100 రూపాయలకు అమ్మాను\".",
  },

  sale_logged: {
    en: (d) =>
      `✅ Logged: ${qtyUnit(d.qty, d.unit)} ${d.item} for ${money(d.amount)}` +
      (d.payment_type === "udhaar"
        ? ` (${d.party}'s udhaar, total due: ${money(d.newDue)}).`
        : " (Cash)."),
    hi: (d) =>
      `✅ दर्ज किया: ${qtyUnit(d.qty, d.unit)} ${d.item} ${money(d.amount)} में` +
      (d.payment_type === "udhaar"
        ? ` (${d.party} का उधार, कुल बाकी: ${money(d.newDue)})।`
        : " (नकद)।"),
    te: (d) =>
      `✅ నమోదైంది: ${qtyUnit(d.qty, d.unit)} ${d.item} ${money(d.amount)}కి` +
      (d.payment_type === "udhaar"
        ? ` (${d.party} ఉధార్, మొత్తం బాకీ: ${money(d.newDue)}).`
        : " (నగదు)."),
  },

  restocked: {
    en: (d) =>
      `📦 Got it — added ${qtyUnit(d.qty, d.unit)} ${d.item} to your stock. You now have ${qtyUnit(d.newStock, d.unit)} on the shelf.`,
    hi: (d) =>
      `📦 हो गया — ${qtyUnit(d.qty, d.unit)} ${d.item} स्टॉक में जोड़ा। अब आपके पास ${qtyUnit(d.newStock, d.unit)} है।`,
    te: (d) =>
      `📦 అయిపోయింది — ${qtyUnit(d.qty, d.unit)} ${d.item} స్టాక్‌లో చేర్చాను. ఇప్పుడు మీ దగ్గర ${qtyUnit(d.newStock, d.unit)} ఉంది.`,
  },

  payment_recorded: {
    en: (d) =>
      `✅ Noted: ${d.party} paid ${money(d.amount)}. ` +
      (d.remaining > 0 ? `Remaining udhaar: ${money(d.remaining)}.` : `Account clear! 🎉`),
    hi: (d) =>
      `✅ दर्ज किया: ${d.party} ने ${money(d.amount)} दिए। ` +
      (d.remaining > 0 ? `बाकी उधार: ${money(d.remaining)}।` : `खाता साफ़! 🎉`),
    te: (d) =>
      `✅ నమోదైంది: ${d.party} ${money(d.amount)} చెల్లించారు. ` +
      (d.remaining > 0 ? `మిగిలిన ఉధార్: ${money(d.remaining)}.` : `ఖాతా క్లియర్! 🎉`),
  },

  product_added: {
    en: (d) => `🆕 Great — I've added "${d.item}" to your products. You can start logging sales for it right away.`,
    hi: (d) => `🆕 बढ़िया — "${d.item}" आपके प्रोडक्ट में जुड़ गया। अब इसकी बिक्री दर्ज कर सकते हैं।`,
    te: (d) => `🆕 బాగుంది — "${d.item}" మీ ఉత్పత్తులలో చేర్చాను. ఇప్పుడే దీని అమ్మకాలు నమోదు చేయవచ్చు.`,
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
    en: (d) => `✅ Expense noted: ${money(d.amount)} for ${d.category}.`,
    hi: (d) => `✅ खर्च दर्ज: ${d.category} के लिए ${money(d.amount)}।`,
    te: (d) => `✅ ఖర్చు నమోదైంది: ${d.category} కోసం ${money(d.amount)}.`,
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

  customer_dues_report: {
    en: (d) =>
      d.status === "no_name"
        ? "Whose udhaar do you want to check? Please tell me the customer's name."
        : d.status === "not_found"
          ? `🤔 I don't have a customer named "${d.name}" yet.`
          : d.status === "clear"
            ? `🎉 ${d.name} has no udhaar pending. All clear!`
            : `🧾 ${d.name}'s pending udhaar: ${money(d.outstanding)}.`,
    hi: (d) =>
      d.status === "no_name"
        ? "किसका उधार देखना है? कृपया ग्राहक का नाम बताइए।"
        : d.status === "not_found"
          ? `🤔 "${d.name}" नाम का कोई ग्राहक अभी नहीं है।`
          : d.status === "clear"
            ? `🎉 ${d.name} का कोई उधार बाकी नहीं। सब क्लियर!`
            : `🧾 ${d.name} का बकाया उधार: ${money(d.outstanding)}।`,
    te: (d) =>
      d.status === "no_name"
        ? "ఎవరి ఉధార్ చూడాలి? దయచేసి వినియోగదారు పేరు చెప్పండి."
        : d.status === "not_found"
          ? `🤔 "${d.name}" పేరుతో వినియోగదారు ఇంకా లేరు.`
          : d.status === "clear"
            ? `🎉 ${d.name}కి ఏ ఉధార్ బాకీ లేదు. అంతా క్లియర్!`
            : `🧾 ${d.name} బాకీ ఉధార్: ${money(d.outstanding)}.`,
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

  chat: {
    en: () => "",
    hi: () => "",
    te: () => "",
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
