import { useTranslation } from "react-i18next";
import { Clock, Smartphone, GraduationCap, IndianRupee, NotebookPen } from "lucide-react";
import { Section, Eyebrow, Reveal } from "./ui";

const CARDS = [
  { key: "time", icon: Clock, rotate: "-2.5deg" },
  { key: "tech", icon: Smartphone, rotate: "1.8deg" },
  { key: "learn", icon: GraduationCap, rotate: "-1.2deg" },
  { key: "cost", icon: IndianRupee, rotate: "2.4deg" },
  { key: "habit", icon: NotebookPen, rotate: "-2deg" },
];

export default function Problem() {
  const { t } = useTranslation();
  return (
    <Section id="problem" className="bg-paper-deep/40">
      <Reveal>
        <Eyebrow>{t("problem.eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-shopfront sm:text-4xl">
          {t("problem.heading")}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <Reveal key={c.key} delay={i * 0.06}>
              <article
                className="torn-bottom ledger-margin relative h-full overflow-hidden rounded-t-lg bg-[#fffdf6] pb-8 pl-12 pr-5 pt-5 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-transform hover:!rotate-0"
                style={{ transform: `rotate(${c.rotate})` }}
              >
                <div className="ledger-lines absolute inset-0 opacity-60" />
                <div className="relative">
                  <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-lg bg-terracotta/10 text-terracotta">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-shopfront">
                    {t(`problem.cards.${c.key}.title`)}
                  </h3>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-ink/70">
                    {t(`problem.cards.${c.key}.body`)}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}

        <Reveal delay={0.3}>
          <div className="flex h-full flex-col justify-center rounded-2xl bg-shopfront p-6 text-paper shadow-[var(--shadow-card)]">
            <p className="font-display text-2xl font-semibold leading-snug">
              {t("problem.closingTitle")}
            </p>
            <p className="mt-3 font-body text-sm text-paper/70">
              {t("problem.closingBody")}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
