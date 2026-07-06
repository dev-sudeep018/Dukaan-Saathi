import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const { t } = useTranslation();
  const { isAuthed } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const LINKS = [
    { href: "#how", label: t("nav.howItWorks") },
    { href: "#demo", label: t("nav.liveDemo") },
    { href: "#impact", label: t("nav.impact") },
    { href: "#team", label: t("nav.team") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-shopfront/10 bg-paper/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5 tap-highlight-none">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-shopfront font-display text-lg font-bold text-marigold">दु</span>
          <span className="font-display text-xl font-semibold text-shopfront">Dukaan Saathi</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-sans text-sm font-medium text-ink/70 transition-colors hover:text-terracotta">
              {l.label}
            </a>
          ))}
          <LanguageSwitcher />
          <Link to="/simulator" className="font-sans text-sm font-medium text-ink/70 hover:text-terracotta">
            {t("nav.simulator")}
          </Link>
          <Link
            to={isAuthed ? "/app" : "/login"}
            className="rounded-full bg-marigold px-4 py-2 font-sans text-sm font-semibold text-shopfront shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {isAuthed ? t("nav.dashboard") : t("nav.login")}
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-lg text-shopfront md:hidden tap-highlight-none" aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-shopfront/10 bg-paper px-5 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 font-sans text-sm font-medium text-ink/80">
                {l.label}
              </a>
            ))}
            <div className="px-2 py-2"><LanguageSwitcher /></div>
            <Link to="/simulator" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 font-sans text-sm font-medium text-ink/80">
              {t("nav.simulator")}
            </Link>
            <Link to={isAuthed ? "/app" : "/login"} onClick={() => setOpen(false)} className="mt-1 rounded-full bg-marigold px-4 py-2.5 text-center font-sans text-sm font-semibold text-shopfront">
              {isAuthed ? t("nav.dashboard") : t("nav.login")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
