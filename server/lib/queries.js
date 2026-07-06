import { db } from "../db.js";

/* All queries are scoped by shop_id. Timestamps are stored UTC; we compare in
   local time so "today" matches the shopkeeper's day. */
const TODAY = "date(created_at, 'localtime') = date('now', 'localtime')";

export function todaySummary(shopId) {
  const sales = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS revenue,
              COALESCE(SUM(cost_amount),0) AS cost,
              COALESCE(SUM(CASE WHEN payment_type='cash' THEN amount ELSE 0 END),0) AS cash,
              COUNT(*) AS orders
       FROM sales WHERE shop_id = ? AND ${TODAY}`,
    )
    .get(shopId);
  const repay = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE shop_id = ? AND ${TODAY}`,
    )
    .get(shopId);
  const exp = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE shop_id = ? AND ${TODAY}`,
    )
    .get(shopId);

  const revenue = sales.revenue;
  const profit = sales.revenue - sales.cost; // gross profit (revenue − cost of goods)
  const expenses = exp.total;
  const netProfit = profit - expenses; // net profit (gross − running expenses)
  const moneyReceived = sales.cash + repay.total; // cash sales + udhaar repayments
  return {
    revenue,
    profit,
    expenses,
    netProfit,
    moneyReceived,
    orders: sales.orders,
    udhaarGiven: revenue - sales.cash,
  };
}

export function salesFeed(shopId, limit = 25) {
  return db
    .prepare(
      `SELECT s.id, s.item_text, s.qty, s.unit_price, s.amount, s.payment_type,
              s.created_at, c.name AS customer
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.shop_id = ? ORDER BY s.created_at DESC LIMIT ?`,
    )
    .all(shopId, limit);
}

export function inventory(shopId) {
  return db
    .prepare(
      `SELECT id, name, unit, stock_qty, cost_price, sell_price
       FROM products WHERE shop_id = ? ORDER BY stock_qty ASC, name ASC`,
    )
    .all(shopId);
}

export function lowStock(shopId, threshold = 5) {
  return db
    .prepare(
      `SELECT name, unit, stock_qty FROM products
       WHERE shop_id = ? AND stock_qty <= ? ORDER BY stock_qty ASC`,
    )
    .all(shopId, threshold);
}

/* Outstanding udhaar per customer = udhaar sales − repayments.
   Wrapped in a subquery so we can filter on the computed alias per row
   (HAVING without GROUP BY would collapse to a single group in SQLite). */
export function dues(shopId) {
  return db
    .prepare(
      `SELECT id, name, outstanding FROM (
         SELECT c.id AS id, c.name AS name,
           COALESCE((SELECT SUM(amount) FROM sales
                     WHERE customer_id = c.id AND payment_type='udhaar'),0)
         - COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id),0)
           AS outstanding
         FROM customers c WHERE c.shop_id = ?
       )
       WHERE outstanding > 0.001
       ORDER BY outstanding DESC`,
    )
    .all(shopId);
}

export function totalDues(shopId) {
  const rows = dues(shopId);
  return {
    total: rows.reduce((s, r) => s + r.outstanding, 0),
    customers: rows,
  };
}

export function productsSoldToday(shopId) {
  return db
    .prepare(
      `SELECT item_text, SUM(qty) AS qty, SUM(amount) AS amount
       FROM sales WHERE shop_id = ? AND ${TODAY}
       GROUP BY lower(item_text) ORDER BY amount DESC`,
    )
    .all(shopId);
}

/* Per-item profit for today: revenue, cost of goods and the profit each item made. */
export function itemProfitToday(shopId) {
  return db
    .prepare(
      `SELECT item_text AS item, SUM(qty) AS qty,
              SUM(amount) AS revenue, SUM(cost_amount) AS cost,
              SUM(amount - cost_amount) AS profit
       FROM sales WHERE shop_id = ? AND ${TODAY}
       GROUP BY lower(item_text) ORDER BY profit DESC`,
    )
    .all(shopId);
}

/* Today's best performers, derived from per-item numbers. Returns null when no sales. */
export function bestSellerToday(shopId) {
  const rows = itemProfitToday(shopId);
  if (!rows.length) return null;
  const byQty = [...rows].sort((a, b) => b.qty - a.qty)[0];
  const byProfit = [...rows].sort((a, b) => b.profit - a.profit)[0];
  return {
    topSeller: { item: byQty.item, qty: byQty.qty, revenue: byQty.revenue },
    topProfit: { item: byProfit.item, profit: byProfit.profit },
  };
}

/* Today's expenses: running total plus the individual entries. */
export function todayExpenses(shopId) {
  const items = db
    .prepare(
      `SELECT id, category, note, amount, created_at
       FROM expenses WHERE shop_id = ? AND ${TODAY} ORDER BY created_at DESC`,
    )
    .all(shopId);
  return { total: items.reduce((s, r) => s + r.amount, 0), items };
}

/* Undo the single most recent entry (sale, expense or payment) for a shop.
   Reverses side effects — a reverted sale returns its qty to stock.
   Returns { type, description } or null when there is nothing to undo. */
export function undoLast(shopId) {
  const candidates = [
    db.prepare(`SELECT 'sale' AS type, id, created_at, item_text, qty, amount, product_id
                FROM sales WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`).get(shopId),
    db.prepare(`SELECT 'expense' AS type, id, created_at, category, note, amount
                FROM expenses WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`).get(shopId),
    db.prepare(`SELECT 'payment' AS type, p.id, p.created_at, p.amount, c.name AS party
                FROM payments p LEFT JOIN customers c ON c.id = p.customer_id
                WHERE p.shop_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 1`).get(shopId),
  ].filter(Boolean);
  if (!candidates.length) return null;

  const last = candidates.sort((a, b) =>
    b.created_at < a.created_at ? -1 : b.created_at > a.created_at ? 1 : 0,
  )[0];

  const undo = db.transaction((row) => {
    if (row.type === "sale") {
      if (row.product_id) {
        db.prepare("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?").run(row.qty, row.product_id);
      }
      db.prepare("DELETE FROM sales WHERE id = ?").run(row.id);
      return { type: "sale", description: `${+Number(row.qty)} ${row.item_text} (₹${Math.round(row.amount)})` };
    }
    if (row.type === "expense") {
      db.prepare("DELETE FROM expenses WHERE id = ?").run(row.id);
      return { type: "expense", description: `${row.category || row.note || "expense"} (₹${Math.round(row.amount)})` };
    }
    db.prepare("DELETE FROM payments WHERE id = ?").run(row.id);
    return { type: "payment", description: `${row.party || "payment"} (₹${Math.round(row.amount)})` };
  });
  return undo(last);
}

export function last7Days(shopId) {
  const rows = db
    .prepare(
      `SELECT date(created_at, 'localtime') AS day,
              SUM(amount) AS revenue,
              SUM(amount - cost_amount) AS profit
       FROM sales WHERE shop_id = ?
         AND date(created_at,'localtime') >= date('now','localtime','-6 days')
       GROUP BY day ORDER BY day ASC`,
    )
    .all(shopId);
  // fill gaps for a clean 7-point chart
  const byDay = Object.fromEntries(rows.map((r) => [r.day, r]));
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = db
      .prepare("SELECT date('now','localtime', ?) AS d")
      .get(`-${i} days`).d;
    out.push({ day: d, revenue: byDay[d]?.revenue || 0, profit: byDay[d]?.profit || 0 });
  }
  return out;
}
