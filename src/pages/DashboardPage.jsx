import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wallet, TrendingUp, ShoppingBag, RefreshCw, LogOut,
  MessageSquare, Package, Users, AlertTriangle,
  Receipt, BarChart3, Star, Plus,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher";

const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const timeOf = (s) => (s ? s.replace(/^.*\s/, "").slice(0, 5) : "");

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const syncedLang = useRef(false); // only adopt shop language once, don't fight the switcher

  const load = useCallback(async () => {
    try {
      const d = await api.dashboard();
      setData(d);
      if (!syncedLang.current && d.shop?.lang_pref && d.shop.lang_pref !== i18n.resolvedLanguage) {
        i18n.changeLanguage(d.shop.lang_pref);
      }
      syncedLang.current = true;
    } catch (e) {
      setErr(e.message);
      if (/auth|session|401/i.test(e.message)) { logout(); navigate("/login"); }
    } finally {
      setLoading(false);
    }
  }, [i18n, logout, navigate]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000); // keep the dashboard live
    return () => clearInterval(id);
  }, [load]);

  // if the shopkeeper changes language here, remember it for their WhatsApp replies
  useEffect(() => {
    if (!syncedLang.current) return;
    const lng = i18n.resolvedLanguage?.slice(0, 2);
    if (lng && ["en", "hi", "te"].includes(lng)) api.setLang(lng).catch(() => {});
  }, [i18n.resolvedLanguage]);

  const collect = async (c) => {
    const input = window.prompt(t("dashboard.collectPrompt", { name: c.name }), String(c.outstanding));
    const amount = Number(input);
    if (!amount || amount <= 0) return;
    await api.collect(c.id, amount);
    load();
  };

  const addExpense = async () => {
    const category = window.prompt(t("dashboard.expenseCatPrompt"));
    if (!category) return;
    const amount = Number(window.prompt(t("dashboard.expenseAmtPrompt", { category })));
    if (!amount || amount <= 0) return;
    await api.addExpense(amount, category.trim());
    load();
  };

  if (loading && !data) {
    return <div className="grid min-h-screen place-items-center bg-paper text-ink/50">{t("common.loading")}</div>;
  }

  const s = data?.summary || {};
  const trend = data?.trend || [];
  const maxRev = Math.max(1, ...trend.map((d) => d.revenue));

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-shopfront/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-shopfront font-display text-lg font-bold text-marigold">दु</span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold text-shopfront">{data?.shop?.name || "My Shop"}</p>
              <p className="text-xs text-ink/50">{data?.shop?.whatsapp_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/simulator" className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3 py-2 text-xs font-semibold text-leaf hover:bg-leaf/20">
              <MessageSquare className="h-4 w-4" /> {t("nav.simulator")}
            </Link>
            <button onClick={load} className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-black/5 hover:bg-paper-deep" title={t("dashboard.refresh")}>
              <RefreshCw className={`h-4 w-4 text-ink/60 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => { logout(); navigate("/"); }} className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-black/5 hover:bg-paper-deep" title={t("nav.logout")}>
              <LogOut className="h-4 w-4 text-terracotta" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {err && <p className="mb-4 rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{err}</p>}

        {/* stat tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Wallet} tone="leaf" label={t("dashboard.moneyToday")} value={money(s.moneyReceived)} />
          <Stat icon={TrendingUp} tone="marigold" label={t("dashboard.netProfitToday")} value={money(s.netProfit)} sub={`${t("dashboard.grossProfit")}: ${money(s.profit)}`} />
          <Stat icon={Receipt} tone="terracotta" label={t("dashboard.expensesToday")} value={money(s.expenses)} />
          <Stat icon={ShoppingBag} tone="shopfront" label={t("dashboard.orders")} value={s.orders || 0} />
        </div>

        {data?.bestSeller && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-marigold/10 px-4 py-3 text-sm text-shopfront ring-1 ring-marigold/20">
            <Star className="h-4 w-4 text-marigold" />
            <span className="font-semibold capitalize">{data.bestSeller.topSeller.item}</span>
            <span className="text-ink/60">{t("dashboard.bestSeller")}</span>
            {data.bestSeller.topProfit && (
              <span className="ml-auto text-ink/60">
                {t("dashboard.mostProfit")}: <span className="font-semibold capitalize text-shopfront">{data.bestSeller.topProfit.item}</span> ({money(data.bestSeller.topProfit.profit)})
              </span>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* left: trend + sales */}
          <div className="lg:col-span-2 space-y-6">
            <Card title={t("dashboard.trend")}>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(27,58,75,0.08)" />
                    <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: "#22201c99" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(245,166,35,0.08)" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(27,58,75,0.1)", fontSize: 12 }}
                      formatter={(v, n) => [money(v), n === "revenue" ? t("dashboard.revenueChart") : t("dashboard.profitChart")]}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={38}>
                      {trend.map((d, i) => (
                        <Cell key={i} fill={d.revenue >= maxRev ? "#F5A623" : "#1B3A4B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title={t("dashboard.salesFeed")}>
              {data?.sales?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-ink/40">
                      <tr>
                        <th className="py-2">{t("dashboard.item")}</th>
                        <th className="py-2">{t("dashboard.qty")}</th>
                        <th className="py-2">{t("dashboard.amount")}</th>
                        <th className="py-2">{t("dashboard.customer")}</th>
                        <th className="py-2 text-right">{t("dashboard.time")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.map((row) => (
                        <tr key={row.id} className="border-t border-black/5">
                          <td className="py-2.5 font-medium capitalize text-shopfront">{row.item_text}</td>
                          <td className="py-2.5 text-ink/70">{+row.qty}</td>
                          <td className="py-2.5 font-semibold">{money(row.amount)}</td>
                          <td className="py-2.5">
                            {row.payment_type === "udhaar" ? (
                              <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs text-terracotta">
                                {row.customer || t("dashboard.udhaar")}
                              </span>
                            ) : (
                              <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-xs text-leaf">{t("dashboard.cash")}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-xs text-ink/40">{timeOf(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>{t("dashboard.noSales")}</Empty>
              )}
            </Card>

            <Card title={t("dashboard.profitByItem")} icon={BarChart3}>
              {data?.itemProfit?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-ink/40">
                      <tr>
                        <th className="py-2">{t("dashboard.item")}</th>
                        <th className="py-2">{t("dashboard.qty")}</th>
                        <th className="py-2">{t("dashboard.revenue")}</th>
                        <th className="py-2 text-right">{t("dashboard.profitChart")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.itemProfit.map((row) => (
                        <tr key={row.item} className="border-t border-black/5">
                          <td className="py-2.5 font-medium capitalize text-shopfront">{row.item}</td>
                          <td className="py-2.5 text-ink/70">{+Number(row.qty).toFixed(1)}</td>
                          <td className="py-2.5 text-ink/70">{money(row.revenue)}</td>
                          <td className={`py-2.5 text-right font-semibold ${row.profit >= 0 ? "text-leaf" : "text-terracotta"}`}>{money(row.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>{t("dashboard.noSales")}</Empty>
              )}
            </Card>
          </div>

          {/* right: dues + expenses + inventory */}
          <div className="space-y-6">
            <Card title={t("dashboard.dues")} icon={Users} accent={money(data?.dues?.total || 0)}>
              {data?.dues?.customers?.length ? (
                <ul className="space-y-2">
                  {data.dues.customers.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                      <span className="font-medium text-shopfront">{c.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-terracotta">{money(c.outstanding)}</span>
                        <button onClick={() => collect(c)} className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-semibold text-leaf hover:bg-leaf/25">
                          {t("dashboard.collect")}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>{t("dashboard.noDues")}</Empty>
              )}
            </Card>

            <Card title={t("dashboard.expensesToday")} icon={Receipt} accent={money(data?.expenses?.total || 0)}>
              <button onClick={addExpense} className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/20">
                <Plus className="h-3.5 w-3.5" /> {t("dashboard.addExpense")}
              </button>
              {data?.expenses?.items?.length ? (
                <ul className="space-y-2">
                  {data.expenses.items.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                      <span className="font-medium capitalize text-shopfront">{e.category}</span>
                      <span className="text-sm font-semibold text-terracotta">{money(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>{t("dashboard.noExpenses")}</Empty>
              )}
            </Card>

            <Card title={t("dashboard.inventory")} icon={Package}>
              {data?.inventory?.length ? (
                <ul className="space-y-1.5">
                  {data.inventory.map((p) => {
                    const low = p.stock_qty <= 5;
                    return (
                      <li key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-paper">
                        <span className="flex items-center gap-2 capitalize text-shopfront">
                          {low && <AlertTriangle className="h-3.5 w-3.5 text-terracotta" />}
                          {p.name}
                        </span>
                        <span className={low ? "font-semibold text-terracotta" : "text-ink/60"}>
                          {+p.stock_qty.toFixed(1)} {p.unit !== "unit" ? p.unit : ""}
                          {low && <span className="ml-1 text-xs">({t("dashboard.lowStockTag")})</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty>{t("dashboard.noStock")}</Empty>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    leaf: "bg-leaf/10 text-leaf",
    marigold: "bg-marigold/15 text-marigold",
    shopfront: "bg-shopfront/10 text-shopfront",
    terracotta: "bg-terracotta/10 text-terracotta",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/5">
      <div className={`inline-grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-shopfront">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, accent, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wide text-shopfront">
          {Icon && <Icon className="h-4 w-4 text-terracotta" />} {title}
        </h2>
        {accent && <span className="font-display text-lg font-semibold text-terracotta">{accent}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="rounded-lg bg-paper px-3 py-6 text-center text-sm text-ink/50">{children}</p>;
}
