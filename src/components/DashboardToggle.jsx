import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Monitor, TrendingUp, Package, Users, ArrowRight } from "lucide-react";
import { Section, Reveal } from "./ui";
import { useAuth } from "../lib/auth.jsx";

export default function DashboardToggle() {
  const { t } = useTranslation();
  const { isAuthed } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Section id="dashboard" className="pt-0">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-3xl border border-shopfront/10 bg-white/70 p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
          <p className="font-body text-sm text-ink/60">{t("dashToggle.prompt")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-shopfront px-5 py-2.5 font-sans text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 tap-highlight-none"
            >
              <Monitor className="h-4 w-4" />
              {open ? t("dashToggle.hide") : t("dashToggle.show")}
            </button>
            <Link
              to={isAuthed ? "/app" : "/login"}
              className="inline-flex items-center gap-2 rounded-full border border-shopfront/20 px-5 py-2.5 font-sans text-sm font-semibold text-shopfront transition-colors hover:bg-shopfront hover:text-paper"
            >
              {t("dashToggle.openReal")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
                  <DashCard icon={TrendingUp} tone="leaf" label={t("dashToggle.profit")} value="₹1,240" foot="34 orders · ₹6,890" />
                  <DashCard icon={Package} tone="terracotta" label={t("dashToggle.low")} value="3 items" foot="Sugar · Oil · Parle-G" />
                  <DashCard icon={Users} tone="marigold" label={t("dashToggle.dues")} value="₹4,120" foot="6 customers" />
                </div>
                <p className="mt-5 font-body text-xs text-ink/40">{t("dashToggle.note")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
}

function DashCard({ icon: Icon, label, value, foot, tone }) {
  const toneMap = {
    leaf: "text-leaf bg-leaf/10",
    terracotta: "text-terracotta bg-terracotta/10",
    marigold: "text-marigold bg-marigold/15",
  };
  return (
    <div className="rounded-2xl bg-paper p-5 ring-1 ring-black/5">
      <div className={`inline-grid h-9 w-9 place-items-center rounded-lg ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-shopfront">{value}</p>
      <p className="mt-1 font-body text-xs text-ink/50">{foot}</p>
    </div>
  );
}
