import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Section, Eyebrow, Reveal } from "./ui";

export default function TeamCTA() {
  const { t } = useTranslation();
  return (
    <Section id="team">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white px-6 py-14 text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:px-12">
          <div className="hero-glow absolute inset-x-0 top-0 -z-0 h-40 opacity-40" />
          <div className="relative">
            <Eyebrow className="text-marigold">{t("team.eyebrow")}</Eyebrow>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-shopfront sm:text-4xl">
              {t("team.heading")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-base text-ink/70">{t("team.sub")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/simulator"
                className="inline-flex items-center gap-2 rounded-full bg-shopfront px-6 py-3 font-sans text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
              >
                <MessageSquare className="h-5 w-5" /> {t("team.tryDemo")}
              </Link>
              <a
                href="#top"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-paper px-6 py-3 font-sans text-sm font-semibold text-ink transition-colors hover:bg-white"
              >
                <ArrowRight className="h-5 w-5" /> See platform overview
              </a>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-14">
          <p className="text-center font-sans text-sm font-semibold uppercase tracking-wide text-ink/40">
            {t("team.builtBy")}
          </p>
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {TEAM.map((m) => (
              <div key={m.name} className="rounded-2xl bg-white dark:bg-shopfront p-5 text-center ring-1 ring-black/5 dark:ring-white/5">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-marigold/15 font-display text-lg font-bold text-terracotta">
                  {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <p className="mt-3 font-sans text-sm font-semibold text-shopfront">{m.name}</p>
                <p className="font-body text-xs text-ink/50">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
