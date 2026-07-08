import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Store, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context.js";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { motion } from "motion/react";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startDemo = async () => {
    setError("");
    setBusy(true);
    try {
      const number = "+91" + Math.floor(7000000000 + (Date.now() % 2999999999));
      const lang = i18n.resolvedLanguage?.slice(0, 2) || "en";
      const res = await api.register({ whatsapp_number: number, name: "Sai Krishna Kirana Store", pin: "1234", lang });
      login(res.token, res.shop, { persist: true });
      await api.loadDemo();
      navigate("/app");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const startCustom = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    setError("");
    setBusy(true);
    try {
      // Generate a deterministic fake number for this device to simulate "account creation/login"
      let storedNumber = localStorage.getItem("dukaan_custom_number");
      if (!storedNumber) {
        storedNumber = "+91" + Math.floor(8000000000 + (Date.now() % 1999999999));
        localStorage.setItem("dukaan_custom_number", storedNumber);
      }
      
      const lang = i18n.resolvedLanguage?.slice(0, 2) || "en";
      // Try to register. If it conflicts, the user already registered this device, so try to login.
      let res;
      try {
        res = await api.register({ whatsapp_number: storedNumber, name: shopName.trim(), pin: "0000", lang });
      } catch (regErr) {
        if (regErr.message.includes("already registered")) {
          res = await api.login({ whatsapp_number: storedNumber, pin: "0000" });
        } else {
          throw regErr;
        }
      }
      login(res.token, res.shop, { persist: true });
      navigate("/app");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-10 font-body text-ink">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-shopfront transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("common.backHome")}
          </Link>
          <LanguageSwitcher />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-white dark:bg-shopfront p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 dark:ring-white/5 sm:p-10"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-leaf/10 text-leaf mb-4 ring-1 ring-leaf/20">
              <Store className="h-8 w-8" />
            </span>
            <h1 className="font-display text-2xl font-bold text-shopfront tracking-tight">
              Get Started
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Experience the AI Business Partner for your Kirana store instantly. No signup required.
            </p>
          </div>

          <button
            onClick={startDemo}
            disabled={busy}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-shopfront px-6 py-3.5 font-sans text-sm font-semibold text-paper shadow-md transition-all hover:bg-shopfront-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-marigold" />
            <span>🚀 Explore Demo</span>
            <div className="absolute inset-0 -translate-x-full bg-white dark:bg-shopfront/20 transition-transform duration-500 group-hover:translate-x-full" />
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={startCustom} className="relative">
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter your Shop Name"
              disabled={busy}
              className="w-full rounded-full border border-black/10 dark:border-white/10 bg-paper px-5 py-3.5 pr-12 text-sm text-ink outline-none transition-all focus:border-leaf focus:bg-white dark:bg-shopfront focus:ring-4 focus:ring-leaf/10 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !shopName.trim()}
              className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full bg-leaf text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
