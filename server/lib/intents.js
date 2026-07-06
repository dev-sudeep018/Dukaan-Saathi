import { db, normalize } from "../db.js";
import {
  todaySummary,
  totalDues,
  lowStock,
  todayExpenses,
  bestSellerToday,
  undoLast,
} from "./queries.js";

/* Execute a parsed message against a shop's data.
   Returns { replyKey, data } that replies.compose() turns into localized text. */
export function executeIntent(parsed, shop) {
  const shopId = shop.id;
  switch (parsed.intent) {
    case "log_sale":
      return logSale(parsed, shopId);
    case "restock":
      return restock(parsed, shopId);
    case "record_payment":
      return recordPayment(parsed, shopId);
    case "record_expense":
      return recordExpense(parsed, shopId);
    case "add_product":
      return addProduct(parsed, shopId);
    case "query_profit": {
      const s = todaySummary(shopId);
      return { replyKey: "profit_report", data: s };
    }
    case "query_money_today": {
      const s = todaySummary(shopId);
      return { replyKey: "money_today", data: s };
    }
    case "query_expenses":
      return { replyKey: "expenses_report", data: todayExpenses(shopId) };
    case "query_dues":
      return { replyKey: "dues_report", data: totalDues(shopId) };
    case "query_stock":
      return { replyKey: "stock_report", data: { items: lowStock(shopId) } };
    case "query_sales": {
      const s = todaySummary(shopId);
      return { replyKey: "sales_report", data: s };
    }
    case "day_report":
      return { replyKey: "day_report", data: dayReport(shopId) };
    case "undo_last": {
      const undone = undoLast(shopId);
      return undone
        ? { replyKey: "undone", data: undone }
        : { replyKey: "nothing_to_undo", data: {} };
    }
    case "help":
      return { replyKey: "onboarding", data: {} };
    default:
      return { replyKey: "not_understood", data: {} };
  }
}

/* Assemble a full end-of-day snapshot from the existing queries. */
function dayReport(shopId) {
  const s = todaySummary(shopId);
  const dues = totalDues(shopId);
  const low = lowStock(shopId);
  const best = bestSellerToday(shopId);
  return {
    revenue: s.revenue,
    profit: s.profit,
    expenses: s.expenses,
    netProfit: s.netProfit,
    moneyReceived: s.moneyReceived,
    orders: s.orders,
    duesTotal: dues.total,
    duesCount: dues.customers.length,
    lowStock: low,
    best,
  };
}

/* ---- product / customer find-or-create ------------------------------------ */
function findOrCreateProduct(shopId, name, { unit = "unit", sellPrice = 0 } = {}) {
  const norm = normalize(name);
  let p = db
    .prepare("SELECT * FROM products WHERE shop_id = ? AND name_norm = ?")
    .get(shopId, norm);
  if (!p) {
    // Unknown cost → assume a modest 20% margin so demo profit is believable.
    const cost = sellPrice > 0 ? Math.round(sellPrice * 0.8) : 0;
    const info = db
      .prepare(
        `INSERT INTO products (shop_id, name, name_norm, unit, stock_qty, cost_price, sell_price)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
      )
      .run(shopId, name, norm, unit, cost, sellPrice);
    p = db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid);
  }
  return p;
}

function findOrCreateCustomer(shopId, name) {
  const norm = normalize(name);
  let c = db
    .prepare("SELECT * FROM customers WHERE shop_id = ? AND name_norm = ?")
    .get(shopId, norm);
  if (!c) {
    const info = db
      .prepare("INSERT INTO customers (shop_id, name, name_norm) VALUES (?, ?, ?)")
      .run(shopId, name, norm);
    c = db.prepare("SELECT * FROM customers WHERE id = ?").get(info.lastInsertRowid);
  }
  return c;
}

function customerOutstanding(customerId) {
  const row = db
    .prepare(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM sales WHERE customer_id = ? AND payment_type='udhaar'),0)
       - COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = ?),0) AS bal`,
    )
    .get(customerId, customerId);
  return row.bal || 0;
}

/* ---- intent implementations ---------------------------------------------- */
function logSale(p, shopId) {
  const item = p.item || "item";
  const qty = p.qty && p.qty > 0 ? p.qty : 1;
  let amount = p.amount;
  let unitPrice = p.unit_price;
  if (amount == null && unitPrice != null) amount = unitPrice * qty;
  if (unitPrice == null && amount != null) unitPrice = amount / qty;
  if (amount == null) amount = 0;

  const payment_type = p.payment_type === "udhaar" ? "udhaar" : "cash";
  let customerId = null;
  let party = p.party_name;

  if (payment_type === "udhaar") {
    if (!party) return { replyKey: "need_customer", data: {} };
    const c = findOrCreateCustomer(shopId, party);
    customerId = c.id;
  }

  const product = findOrCreateProduct(shopId, item, {
    unit: p.unit,
    sellPrice: unitPrice || amount,
  });
  const costAmount = (product.cost_price || 0) * qty;

  db.prepare(
    `INSERT INTO sales (shop_id, product_id, item_text, qty, unit_price, amount, cost_amount, payment_type, customer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(shopId, product.id, item, qty, unitPrice || 0, amount, costAmount, payment_type, customerId);

  db.prepare("UPDATE products SET stock_qty = MAX(stock_qty - ?, 0) WHERE id = ?").run(qty, product.id);

  const newDue = customerId ? customerOutstanding(customerId) : 0;
  return {
    replyKey: "sale_logged",
    data: { item, qty, unit: product.unit, amount, payment_type, party, newDue },
  };
}

function restock(p, shopId) {
  const item = p.item || "item";
  const qty = p.qty && p.qty > 0 ? p.qty : 1;
  const product = findOrCreateProduct(shopId, item, { unit: p.unit });
  if (p.unit_price != null) {
    db.prepare("UPDATE products SET cost_price = ? WHERE id = ?").run(p.unit_price, product.id);
  }
  db.prepare("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?").run(qty, product.id);
  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(product.id);
  return {
    replyKey: "restocked",
    data: { item, qty, unit: updated.unit, newStock: updated.stock_qty },
  };
}

function recordPayment(p, shopId) {
  if (!p.party_name) return { replyKey: "need_customer", data: {} };
  if (!(p.amount > 0)) return { replyKey: "not_understood", data: {} };
  const c = findOrCreateCustomer(shopId, p.party_name);
  db.prepare("INSERT INTO payments (shop_id, customer_id, amount) VALUES (?, ?, ?)").run(
    shopId,
    c.id,
    p.amount,
  );
  const remaining = Math.max(customerOutstanding(c.id), 0);
  return {
    replyKey: "payment_recorded",
    data: { party: c.name, amount: p.amount, remaining },
  };
}

function recordExpense(p, shopId) {
  const amount = p.amount;
  if (!(amount > 0)) return { replyKey: "not_understood", data: {} };
  const category = (p.category || p.item || "misc").toString().trim() || "misc";
  db.prepare(
    "INSERT INTO expenses (shop_id, category, note, amount) VALUES (?, ?, ?, ?)",
  ).run(shopId, category, p._raw || null, amount);

  const { total } = todayExpenses(shopId);
  const { netProfit } = todaySummary(shopId);
  return {
    replyKey: "expense_logged",
    data: { category, amount, totalToday: total, netProfit },
  };
}

function addProduct(p, shopId) {
  const item = p.item || "item";
  findOrCreateProduct(shopId, item, { unit: p.unit, sellPrice: p.unit_price || 0 });
  return { replyKey: "product_added", data: { item } };
}
