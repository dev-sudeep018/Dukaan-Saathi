import { useTranslation } from "react-i18next";
import { Check, X, HelpCircle } from "lucide-react";
import { Section, Eyebrow, Reveal } from "./ui";

/* text rows read [label, mine, theirs] arrays from i18n; bool rows read a label
   string and carry their Yes/No values in code. */
const ROWS = [
  { key: "learning", type: "text" },
  { key: "interface", type: "text" },
  { key: "literacy", type: "bool", mine: true, theirs: false },
  { key: "language", type: "bool", mine: true, theirs: false },
  { key: "notebook", type: "bool", mine: true, theirs: false },
  { key: "computer", type: "bool", mine: false, theirs: true },
  { key: "setup", type: "text" },
  { key: "market", type: "bool", mine: true, theirs: false },
];

export default function Comparison() {
  const { t } = useTranslation();

  const Cell = ({ v, positive }) => {
    if (v === true)
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium ${positive ? "text-leaf" : "text-ink"}`}>
          <Check className="h-4 w-4" /> {t("compare.yes")}
        </span>
      );
    if (v === false)
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-terracotta/80">
          <X className="h-4 w-4" /> {t("compare.no")}
        </span>
      );
    return <span className={positive ? "font-medium text-shopfront" : "text-ink/60"}>{v}</span>;
  };

  return (
    <Section id="compare" className="bg-paper-deep/40">
      <Reveal>
        <Eyebrow>{t("compare.eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-shopfront sm:text-4xl">
          {t("compare.heading")}
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="px-5 py-4">&nbsp;</th>
                  <th className="bg-marigold/10 px-5 py-4 font-sans text-sm font-bold text-shopfront">
                    {t("compare.mine")}
                  </th>
                  <th className="px-5 py-4 font-sans text-sm font-semibold text-ink/50">
                    {t("compare.theirs")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => {
                  const isText = row.type === "text";
                  const arr = isText ? t(`compare.rows.${row.key}`, { returnObjects: true }) : null;
                  const label = isText ? arr[0] : t(`compare.rows.${row.key}`);
                  const mine = isText ? arr[1] : row.mine;
                  const theirs = isText ? arr[2] : row.theirs;
                  return (
                    <tr key={row.key} className={i % 2 ? "bg-paper/40" : "bg-white"}>
                      <td className="px-5 py-3.5 font-body font-medium text-ink/80">{label}</td>
                      <td className="bg-marigold/5 px-5 py-3.5"><Cell v={mine} positive /></td>
                      <td className="px-5 py-3.5"><Cell v={theirs} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[["why1Q", "why1A"], ["why2Q", "why2A"]].map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-shopfront/15 bg-white/70 p-6">
              <div className="mb-2 inline-flex items-center gap-2 text-terracotta">
                <HelpCircle className="h-5 w-5" />
                <span className="font-sans text-sm font-semibold">{t(`compare.${q}`)}</span>
              </div>
              <p className="font-body text-sm leading-relaxed text-ink/70">{t(`compare.${a}`)}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
