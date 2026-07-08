import { useOutletContext } from "react-router-dom";
import { BarChart3, Star, TrendingUp, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Card, Empty, Stat } from "./DashboardPage";

export default function ReportsPage() {
  const { data, money, t } = useOutletContext();
  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-shopfront">Reports & Analytics</h1>

      {/* stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} tone="leaf" label={t("dashboard.moneyToday")} value={money(s.moneyReceived)} />
        <Stat icon={TrendingUp} tone="marigold" label={t("dashboard.netProfitToday")} value={money(s.netProfit)} sub={`${t("dashboard.grossProfit")}: ${money(s.profit)}`} />
        <Stat icon={Receipt} tone="terracotta" label={t("dashboard.expensesToday")} value={money(s.expenses)} />
        <Stat icon={ShoppingBag} tone="shopfront" label={t("dashboard.orders")} value={s.orders || 0} />
      </div>

      {data?.bestSeller && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-marigold/10 px-4 py-4 text-sm text-shopfront ring-1 ring-marigold/20">
          <Star className="h-5 w-5 text-marigold" />
          <span className="font-semibold capitalize text-base">{data.bestSeller.topSeller.item}</span>
          <span className="text-ink/60">is your {t("dashboard.bestSeller")} today!</span>
          {data.bestSeller.topProfit && (
            <span className="ml-auto text-ink/60 bg-white dark:bg-shopfront/50 px-3 py-1.5 rounded-full border border-marigold/20">
              {t("dashboard.mostProfit")}: <span className="font-semibold capitalize text-shopfront">{data.bestSeller.topProfit.item}</span> ({money(data.bestSeller.topProfit.profit)})
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <tr key={row.item} className="border-t border-black/5 dark:border-white/5">
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

        <Card title={t("dashboard.expensesToday")} icon={Receipt}>
          {data?.expenses?.items?.length ? (
            <ul className="space-y-2">
              {data.expenses.items.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 border border-black/5 dark:border-white/5">
                  <span className="font-medium capitalize text-shopfront">{e.category}</span>
                  <span className="text-sm font-semibold text-terracotta">{money(e.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t("dashboard.noExpenses")}</Empty>
          )}
        </Card>
      </div>
    </div>
  );
}
