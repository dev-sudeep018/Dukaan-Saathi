import { useOutletContext } from "react-router-dom";
import { Users } from "lucide-react";
import { Card, Empty } from "./DashboardPage";
import { api } from "../lib/api";

export default function UdhaarPage() {
  const { data, load, money, t } = useOutletContext();

  const collect = async (c) => {
    const input = window.prompt(t("dashboard.collectPrompt", { name: c.name }), String(c.outstanding));
    const amount = Number(input);
    if (!amount || amount <= 0) return;
    await api.collect(c.id, amount);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-shopfront">Udhaar Khata</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={t("dashboard.pendingUdhaar")} icon={Users} accent={money(data?.dues?.total || 0)}>
            {data?.dues?.customers?.length ? (
              <ul className="space-y-2">
                {data.dues.customers.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 rounded-xl bg-paper px-4 py-3 hover:bg-black/5 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-shopfront capitalize text-base">{c.name}</span>
                      <span className="text-xs text-ink/60 mt-0.5">Customer since {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-ink/50 uppercase tracking-wide">Due</span>
                        <span className="text-lg font-bold text-terracotta">{money(c.outstanding)}</span>
                      </div>
                      <button 
                        onClick={() => collect(c)} 
                        className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-leaf/90 hover:shadow transition-all"
                      >
                        {t("dashboard.collect")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{t("dashboard.noDues")}</Empty>
            )}
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card title="Summary">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
                <span className="text-ink/60">Total Outstanding</span>
                <span className="font-bold text-lg text-terracotta">{money(data?.dues?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
                <span className="text-ink/60">Customers in Debt</span>
                <span className="font-bold text-lg text-shopfront">{data?.dues?.customers?.length || 0}</span>
              </div>
              <p className="text-xs text-ink/50 leading-relaxed mt-2">
                * Collecting Udhaar faster improves your Dukaan Saathi health score and increases your working capital.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
