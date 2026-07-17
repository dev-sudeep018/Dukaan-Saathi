import { motion } from "motion/react";
import { Trans, useTranslation } from "react-i18next";
import { Mic, Cpu, Database, MessageCircle, ArrowRight } from "lucide-react";
import { Section, Eyebrow, Reveal } from "./ui";

const STEPS = [
  { key: "in", icon: Mic },
  { key: "ai", icon: Cpu },
  { key: "db", icon: Database },
  { key: "out", icon: MessageCircle },
];

export default function MagicLoop() {
  const { t } = useTranslation();
  return (
    <Section id="loop">
      <Reveal>
        <Eyebrow>{t("loop.eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-shopfront sm:text-4xl">
          {t("loop.heading")}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.18 }}
                className="flex h-full flex-col rounded-2xl bg-white dark:bg-shopfront p-5 shadow-[var(--shadow-card)] ring-1 ring-black/5 dark:ring-white/5"
              >
                <div className="mb-3 inline-grid h-11 w-11 place-items-center rounded-xl bg-marigold/15 text-terracotta">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-marigold">
                  {t("loop.eyebrow")} · {i + 1}
                </p>
                <h3 className="mt-1 font-sans text-base font-semibold text-shopfront">
                  {t(`loop.steps.${s.key}.title`)}
                </h3>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-ink/70">
                  {t(`loop.steps.${s.key}.body`)}
                </p>
              </motion.div>

              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.18 + 0.25 }}
                  className="hidden items-center justify-center lg:flex"
                >
                  <ArrowRight className="h-6 w-6 text-terracotta/60" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <Reveal delay={0.2}>
        <p className="mx-auto mt-10 max-w-xl text-center font-body text-sm text-ink/60">
          <Trans i18nKey="loop.footnote" components={{ b: <span className="font-semibold text-terracotta" /> }} />
        </p>
      </Reveal>
    </Section>
  );
}
