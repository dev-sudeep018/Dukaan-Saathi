import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Card, Empty, AddSaleModal } from "./DashboardPage";
import { api } from "../lib/api";

export default function SalesPage() {
  const { data, load, money, timeOf, t, busy, setBusy, setErr } = useOutletContext();
  const [showAddSale, setShowAddSale] = useState(false);

  const submitSale = async (sale) => {
    await api.addSale(sale);
    setShowAddSale(false);
    load();
  };

  const exportCsv = async () => {
    setBusy("export");
    setErr("");
    try {
      const blob = await api.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dukaan-${(data?.shop?.name || "shop").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-sales.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-shopfront">Sales</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={busy === "export"}
            className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-shopfront px-4 py-2 text-xs font-semibold text-ink/70 ring-1 ring-black/5 dark:ring-white/5 hover:bg-paper-deep disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {t("dashboard.exportCsv")}
          </button>
          <button
            onClick={() => setShowAddSale(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-shopfront px-4 py-2 text-xs font-semibold text-paper hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="h-4 w-4" /> {t("dashboard.addSale")}
          </button>
        </div>
      </div>

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
                  <tr key={row.id} className="border-t border-black/5 dark:border-white/5">
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

      <AnimatePresence>
        {showAddSale && (
          <AddSaleModal
            onClose={() => setShowAddSale(false)}
            onSubmit={submitSale}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
