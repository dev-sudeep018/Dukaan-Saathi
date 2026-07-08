import { useTranslation } from "react-i18next";
import { Section, Eyebrow, Reveal } from "./ui";
import { useCountUp } from "../hooks/useCountUp";

const STATS = [
  { key: "shops", target: 12, prefix: "", suffix: "M+" },
  { key: "training", target: 0, prefix: "", suffix: " min" },
  { key: "log", target: 3, prefix: "~", suffix: "s" },
  { key: "voice", target: 90, prefix: "", suffix: "%" },
];

function Stat({ prefix, target, suffix, label, sub }) {
  const { ref, display } = useCountUp(target);
  return (
    <div ref={ref} className="rounded-2xl bg-white dark:bg-shopfront/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
      <p className="font-display text-4xl font-semibold text-marigold sm:text-5xl">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="mt-2 font-sans text-sm font-semibold text-paper">{label}</p>
      <p className="mt-1 font-body text-[13px] text-paper/60">{sub}</p>
    </div>
  );
}

export default function Impact() {
  const { t } = useTranslation();
  return (
    <Section id="impact" className="bg-shopfront text-paper">
      <Reveal>
        <Eyebrow className="text-marigold">{t("impact.eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {t("impact.heading")}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.key} delay={i * 0.08}>
            <Stat
              prefix={s.prefix}
              target={s.target}
              suffix={s.suffix}
              label={t(`impact.stats.${s.key}.label`)}
              sub={t(`impact.stats.${s.key}.sub`)}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
