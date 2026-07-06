import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Store, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ whatsapp_number: "", pin: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = { ...form, lang: i18n.resolvedLanguage?.slice(0, 2) || "en" };
      const res = mode === "login" ? await api.login(payload) : await api.register(payload);
      login(res.token, res.shop);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5 py-10 font-body text-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-shopfront">
            <ArrowLeft className="h-4 w-4" /> {t("common.backHome")}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-[var(--shadow-card)] ring-1 ring-black/5 sm:p-9">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-shopfront text-marigold">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-shopfront">
                {mode === "login" ? t("login.title") : t("login.registerBtn")}
              </h1>
              <p className="text-sm text-ink/50">{t("login.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field label={t("login.shopName")}>
                <input
                  className="input"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Sharma Kirana Store"
                  required
                />
              </Field>
            )}
            <Field label={t("login.number")} hint={t("login.numberHint")}>
              <input
                className="input"
                value={form.whatsapp_number}
                onChange={set("whatsapp_number")}
                placeholder="+9198XXXXXXXX"
                inputMode="tel"
                required
              />
            </Field>
            <Field label={t("login.pin")}>
              <input
                className="input"
                value={form.pin}
                onChange={set("pin")}
                placeholder="••••"
                inputMode="numeric"
                type="password"
                required
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-marigold px-6 py-3 font-sans text-sm font-semibold text-shopfront transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy
                ? mode === "login" ? t("login.loggingIn") : t("login.creating")
                : mode === "login" ? t("login.loginBtn") : t("login.registerBtn")}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="mt-5 w-full text-center text-sm font-medium text-terracotta hover:underline"
          >
            {mode === "login" ? t("login.toRegister") : t("login.toLogin")}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-ink/40">
          Tip: register the same number you use in the WhatsApp simulator to see its data here.
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(27,58,75,0.15);
          background: #fff;
          padding: 0.7rem 0.9rem;
          font-size: 0.95rem;
          color: var(--color-ink);
          outline: none;
        }
        .input:focus { border-color: var(--color-marigold); box-shadow: 0 0 0 3px rgba(245,166,35,0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-sm font-medium text-shopfront">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  );
}
