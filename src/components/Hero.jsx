import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trans, useTranslation } from "react-i18next";
import { PlayCircle, ArrowDown } from "lucide-react";
import {
  PhoneShell,
  Bubble,
  VoiceNote,
  TypingDots,
  ResultCard,
} from "./ui";

/* Scripted hero conversation. Each step reveals one more item, then loops. */
const STEPS = 5; // 0: nothing, 1: voice, 2: typing, 3: reply text, 4: card

function HeroPhone() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timings = [900, 1400, 1200, 900, 2600]; // ms per step before advancing
    const t = setTimeout(
      () => setStep((s) => (s + 1) % STEPS),
      timings[step] ?? 1500,
    );
    return () => clearTimeout(t);
  }, [step]);

  return (
    <PhoneShell>
      <div className="ledger-lines chat-scroll flex h-[calc(560px-60px)] flex-col gap-3 overflow-y-auto bg-[#0b141a]/95 px-3 py-4">
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            <VoiceNote side="out" duration="0:06" />
            <p className="mt-1 pr-1 text-right text-[10px] text-paper/40">
              “Ramesh ko 2 kilo chawal, paanch sau rupaye udhaar”
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingDots />
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            <Bubble side="in">
              ✅ <span className="font-semibold">Sale logged.</span> 2kg Rice →
              ₹500. Added to Ramesh’s ledger (udhaar).
            </Bubble>
          </motion.div>
        )}

        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <ResultCard
              title="Sale logged"
              rows={[
                ["Item", "Rice · 2 kg"],
                ["Amount", "₹500"],
                ["Party", "Ramesh"],
                ["Type", "Udhaar (credit)"],
              ]}
            />
          </motion.div>
        )}
      </div>
    </PhoneShell>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft paper-deep top wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-paper-deep/60 to-paper" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 md:grid-cols-2 md:gap-8 md:pb-28 md:pt-16">
        {/* LEFT: copy */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-terracotta/25 bg-white/60 px-3 py-1 font-sans text-xs font-medium text-terracotta"
          >
            {t("hero.badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-shopfront sm:text-5xl md:text-[3.4rem]"
          >
            {t("hero.titleA")}
            <span className="text-terracotta">{t("hero.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-md font-body text-base leading-relaxed text-ink/70 sm:text-lg"
          >
            {t("hero.subhead")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-full bg-marigold px-6 py-3 font-sans text-sm font-semibold text-shopfront shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
            >
              <PlayCircle className="h-5 w-5" />
              {t("hero.ctaPrimary")}
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-shopfront/20 px-6 py-3 font-sans text-sm font-semibold text-shopfront transition-colors hover:bg-shopfront hover:text-paper"
            >
              {t("hero.ctaSecondary")}
              <ArrowDown className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 font-body text-sm text-ink/50"
          >
            <Trans
              i18nKey="hero.langNote"
              components={{ b: <span className="font-semibold text-ink/70" /> }}
            />
          </motion.p>
        </div>

        {/* RIGHT: sticky animated phone */}
        <div className="flex justify-center md:justify-end">
          <div className="relative md:sticky md:top-24">
            {/* the one allowed gradient: marigold → terracotta glow */}
            <div className="hero-glow absolute inset-0 -z-10 scale-110 rounded-[3rem]" />
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroPhone />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
