import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Send, RotateCcw, ArrowRight } from "lucide-react";
import { Section, Eyebrow, Reveal, TypingDots } from "./ui";

/* Fully scripted / mocked — no backend, no LLM call. Each prompt maps to a
   believable reply grounded in real shop numbers. */
const PROMPTS = [
  {
    id: "sale",
    chip: "Log a sale",
    user: "Ramesh ko 2 kilo chawal 500 rupaye udhaar",
    reply: (
      <>
        ✅ <b>Sale logged.</b> 2kg Rice → ₹500, added to <b>Ramesh’s</b> udhaar.
        <div className="mt-2 rounded-lg bg-paper/10 p-2 text-[12px]">
          Ramesh’s total due is now <b>₹1,340</b>.
        </div>
      </>
    ),
  },
  {
    id: "stock",
    chip: "What’s running low?",
    user: "Kya kya khatam hone wala hai?",
    reply: (
      <>
        ⚠️ <b>3 items running low:</b>
        <ul className="mt-2 space-y-1 text-[12px]">
          <li>• Sugar — 2kg left (usually 15kg)</li>
          <li>• Refined Oil — 3 packs left</li>
          <li>• Parle-G — 1 box left</li>
        </ul>
        <div className="mt-2 text-[12px] text-paper/70">
          Want me to add these to a supplier order?
        </div>
      </>
    ),
  },
  {
    id: "profit",
    chip: "Today’s profit?",
    user: "Aaj ka profit kitna hua?",
    reply: (
      <>
        📈 <b>Today’s profit: ₹1,240</b>
        <div className="mt-2 rounded-lg bg-paper/10 p-2 text-[12px] leading-relaxed">
          Sales ₹6,890 · 34 orders · avg ₹203
          <br />
          Best seller: <b>Rice</b> (12kg). Yesterday you did ₹1,090 — up 14%. 🎉
        </div>
      </>
    ),
  },
  {
    id: "due",
    chip: "Who owes me money?",
    user: "Kaun kaun ka udhaar baaki hai?",
    reply: (
      <>
        🧾 <b>₹4,120 in udhaar</b> across 6 customers:
        <ul className="mt-2 space-y-1 text-[12px]">
          <li>• Ramesh — ₹1,340</li>
          <li>• Sita Devi — ₹980</li>
          <li>• Amit Kirana — ₹720</li>
        </ul>
        <div className="mt-2 text-[12px] text-paper/70">
          Shall I send a polite WhatsApp reminder to the top 3?
        </div>
      </>
    ),
  },
];

let msgId = 0;

export default function LiveDemo() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: msgId++,
      side: "in",
      node: (
        <>
          👋 Namaste! I’m Dukaan Saathi. Tap a question below and watch me run
          your shop — no typing needed.
        </>
      ),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (p) => {
    if (typing) return;
    setUsed((u) => (u.includes(p.id) ? u : [...u, p.id]));
    setMessages((m) => [...m, { id: msgId++, side: "out", node: p.user }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: msgId++, side: "in", node: p.reply }]);
    }, 1250);
  };

  const reset = () => {
    setMessages((m) => m.slice(0, 1));
    setUsed([]);
    setTyping(false);
  };

  return (
    <Section id="demo" className="bg-shopfront text-paper">
      <Reveal>
        <Eyebrow className="text-marigold">{t("demo.eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {t("demo.heading")}
        </h2>
        <p className="mt-4 max-w-xl font-body text-base text-paper/70">{t("demo.sub")}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0b141a] shadow-[var(--shadow-phone)]">
          {/* header */}
          <div className="flex items-center justify-between bg-shopfront-700 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-marigold text-sm font-bold text-shopfront">
                दु
              </div>
              <div className="leading-tight">
                <p className="font-sans text-sm font-semibold">Dukaan Saathi</p>
                <p className="text-[11px] text-leaf">● online</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full bg-white dark:bg-shopfront/10 px-3 py-1.5 text-[11px] font-medium text-paper/80 transition-colors hover:bg-white dark:bg-shopfront/20 tap-highlight-none"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("demo.reset")}
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="ledger-lines chat-scroll h-[380px] space-y-3 overflow-y-auto px-4 py-4"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${m.side === "out" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                      m.side === "out"
                        ? "rounded-br-md bg-[#005c4b] text-paper"
                        : "rounded-bl-md bg-white dark:bg-shopfront text-ink"
                    }`}
                  >
                    {m.node}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TypingDots />
              </motion.div>
            )}
          </div>

          {/* prompt chips */}
          <div className="border-t border-white/10 bg-[#0b141a] p-3">
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-paper/40">
              {t("demo.tapToTry")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => send(p)}
                  disabled={typing}
                  className={`rounded-full px-3.5 py-2 font-sans text-[12px] font-medium transition-all tap-highlight-none disabled:opacity-40 ${
                    used.includes(p.id)
                      ? "bg-white dark:bg-shopfront/10 text-paper/50"
                      : "bg-marigold text-shopfront hover:-translate-y-0.5"
                  }`}
                >
                  {t(`demo.prompts.${p.id}`)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-white dark:bg-shopfront/5 px-4 py-2.5">
              <span className="flex-1 text-[12px] text-paper/30">{t("demo.inputPlaceholder")}</span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-marigold text-shopfront">
                <Send className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-6 text-center">
          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 rounded-full bg-marigold px-6 py-3 font-sans text-sm font-semibold text-shopfront transition-transform hover:-translate-y-0.5"
          >
            {t("demo.openFull")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
