import { Router } from "express";
import { requireAuth } from "../auth.js";
import {
  todaySummary,
  salesFeed,
  inventory,
  totalDues,
  productsSoldToday,
  itemProfitToday,
  bestSellerToday,
  todayExpenses,
  last7Days,
} from "../lib/queries.js";
import { db } from "../db.js";

export const dataRouter = Router();
dataRouter.use(requireAuth);

/* Everything the dashboard needs in one call. */
dataRouter.get("/dashboard", (req, res) => {
  const shopId = req.shop.id;
  res.json({
    shop: {
      id: req.shop.id,
      name: req.shop.name,
      whatsapp_number: req.shop.whatsapp_number,
      lang_pref: req.shop.lang_pref,
    },
    summary: todaySummary(shopId),
    sales: salesFeed(shopId, 25),
    inventory: inventory(shopId),
    dues: totalDues(shopId),
    productsSold: productsSoldToday(shopId),
    itemProfit: itemProfitToday(shopId),
    bestSeller: bestSellerToday(shopId),
    expenses: todayExpenses(shopId),
    trend: last7Days(shopId),
  });
});

/* Record an expense from the dashboard. */
dataRouter.post("/expenses", (req, res) => {
  const { amount, category, note } = req.body || {};
  if (!(amount > 0)) {
    return res.status(400).json({ error: "positive amount required" });
  }
  db.prepare(
    "INSERT INTO expenses (shop_id, category, note, amount) VALUES (?, ?, ?, ?)",
  ).run(req.shop.id, (category || "misc").toString().trim() || "misc", note || null, amount);
  res.json({ ok: true, expenses: todayExpenses(req.shop.id), summary: todaySummary(req.shop.id) });
});

/* Record an udhaar repayment from the dashboard. */
dataRouter.post("/payments", (req, res) => {
  const { customer_id, amount } = req.body || {};
  if (!customer_id || !(amount > 0)) {
    return res.status(400).json({ error: "customer_id and positive amount required" });
  }
  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ? AND shop_id = ?")
    .get(customer_id, req.shop.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  db.prepare(
    "INSERT INTO payments (shop_id, customer_id, amount) VALUES (?, ?, ?)",
  ).run(req.shop.id, customer_id, amount);
  res.json({ ok: true, dues: totalDues(req.shop.id) });
});

/* Update the shop's preferred language from the dashboard. */
dataRouter.post("/lang", (req, res) => {
  const { lang } = req.body || {};
  if (!["en", "hi", "te"].includes(lang)) {
    return res.status(400).json({ error: "lang must be en, hi or te" });
  }
  db.prepare("UPDATE shops SET lang_pref = ? WHERE id = ?").run(lang, req.shop.id);
  res.json({ ok: true, lang });
});
