import { db, normalize } from "../db.js";

/* All queries are scoped by shop_id. Timestamps are stored UTC; we compare in
   local time so "today" matches the shopkeeper's day. */
const TODAY = "date(created_at, 'localtime') = date('now', 'localtime')";

export async function todaySummary(shopId) {
  const sales = await db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS revenue,
              COALESCE(SUM(cost_amount),0) AS cost,
              COALESCE(SUM(CASE WHEN payment_type='cash' THEN amount ELSE 0 END),0) AS cash,
              COUNT(*) AS orders
       FROM sales WHERE shop_id = ? AND ${TODAY}`,
    )
    .get(shopId);
  const repay = await db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE shop_id = ? AND ${TODAY}`,
    )
    .get(shopId);
  const exp = await db
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

export async function salesFeed(shopId, limit = 25) {
  return db
    .prepare(
      `SELECT s.id, s.item_text, s.qty, s.unit_price, s.amount, s.payment_type,
              s.created_at, c.name AS customer
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.shop_id = ? ORDER BY s.created_at DESC LIMIT ?`,
    )
    .all(shopId, limit);
}

export async function inventory(shopId) {
  return db
    .prepare(
      `SELECT id, name, unit, stock_qty, cost_price, sell_price
       FROM products WHERE shop_id = ? ORDER BY stock_qty ASC, name ASC`,
    )
    .all(shopId);
}

export async function lowStock(shopId, threshold = 5) {
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
export async function dues(shopId) {
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

export async function totalDues(shopId) {
  const rows = await dues(shopId);
  return {
    total: rows.reduce((s, r) => s + r.outstanding, 0),
    customers: rows,
  };
}

/* Outstanding udhaar for one named customer.
   Matches on the normalized name (exact first, then a loose contains match so
   "ramesh kumar" resolves from "ramesh"). Returns:
     { status: "found",     name, outstanding }  — a known customer
     { status: "clear",     name, outstanding }  — known, but nothing pending
     { status: "not_found", name }               — no such customer
     { status: "no_name" }                        — the message had no name */
export async function customerDues(shopId, name) {
  const query = (name || "").trim();
  if (!query) return { status: "no_name" };

  const norm = normalize(query);
  const rows = await dues(shopId); // only customers with outstanding > 0
  const all = await db
    .prepare("SELECT name, name_norm FROM customers WHERE shop_id = ?")
    .all(shopId);

  const match =
    rows.find((r) => normalize(r.name) === norm) ||
    rows.find((r) => normalize(r.name).includes(norm) || norm.includes(normalize(r.name)));
  if (match) return { status: "found", name: match.name, outstanding: match.outstanding };

  // No outstanding dues, but do we even know this customer?
  const known =
    all.find((c) => c.name_norm === norm) ||
    all.find((c) => c.name_norm.includes(norm) || norm.includes(c.name_norm));
  if (known) return { status: "clear", name: known.name, outstanding: 0 };

  return { status: "not_found", name: query };
}

export async function productsSoldToday(shopId) {
  return db
    .prepare(
      `SELECT item_text, SUM(qty) AS qty, SUM(amount) AS amount
       FROM sales WHERE shop_id = ? AND ${TODAY}
       GROUP BY lower(item_text) ORDER BY amount DESC`,
    )
    .all(shopId);
}

/* Per-item profit for today: revenue, cost of goods and the profit each item made. */
export async function itemProfitToday(shopId) {
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
export async function bestSellerToday(shopId) {
  const rows = await itemProfitToday(shopId);
  if (!rows.length) return null;
  const byQty = [...rows].sort((a, b) => b.qty - a.qty)[0];
  const byProfit = [...rows].sort((a, b) => b.profit - a.profit)[0];
  return {
    topSeller: { item: byQty.item, qty: byQty.qty, revenue: byQty.revenue },
    topProfit: { item: byProfit.item, profit: byProfit.profit },
  };
}

/* Today's expenses: running total plus the individual entries. */
export async function todayExpenses(shopId) {
  const items = await db
    .prepare(
      `SELECT id, category, note, amount, created_at
       FROM expenses WHERE shop_id = ? AND ${TODAY} ORDER BY created_at DESC`,
    )
    .all(shopId);
  return { total: items.reduce((s, r) => s + r.amount, 0), items };
}

/* Undo the single most recent entry (sale, expense or payment) for a shop.
   Reverses side effects — a reverted sale returns its qty to stock. The
   mutations run in one atomic batch. Returns { type, description } or null when
   there is nothing to undo. */
export async function undoLast(shopId) {
  const candidates = (
    await Promise.all([
      db.prepare(`SELECT 'sale' AS type, id, created_at, item_text, qty, amount, product_id
                  FROM sales WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`).get(shopId),
      db.prepare(`SELECT 'expense' AS type, id, created_at, category, note, amount
                  FROM expenses WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`).get(shopId),
      db.prepare(`SELECT 'payment' AS type, p.id, p.created_at, p.amount, c.name AS party
                  FROM payments p LEFT JOIN customers c ON c.id = p.customer_id
                  WHERE p.shop_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 1`).get(shopId),
    ])
  ).filter(Boolean);
  if (!candidates.length) return null;

  const last = candidates.sort((a, b) =>
    b.created_at < a.created_at ? -1 : b.created_at > a.created_at ? 1 : 0,
  )[0];

  const statements = [];
  let result;
  if (last.type === "sale") {
    if (last.product_id) {
      statements.push({
        sql: "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
        args: [last.qty, last.product_id],
      });
    }
    statements.push({ sql: "DELETE FROM sales WHERE id = ?", args: [last.id] });
    result = { type: "sale", description: `${+Number(last.qty)} ${last.item_text} (₹${Math.round(last.amount)})` };
  } else if (last.type === "expense") {
    statements.push({ sql: "DELETE FROM expenses WHERE id = ?", args: [last.id] });
    result = { type: "expense", description: `${last.category || last.note || "expense"} (₹${Math.round(last.amount)})` };
  } else {
    statements.push({ sql: "DELETE FROM payments WHERE id = ?", args: [last.id] });
    result = { type: "payment", description: `${last.party || "payment"} (₹${Math.round(last.amount)})` };
  }

  await db.batch(statements);
  return result;
}

export async function last7Days(shopId) {
  const rows = await db
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
    const d = (
      await db.prepare("SELECT date('now','localtime', ?) AS d").get(`-${i} days`)
    ).d;
    out.push({ day: d, revenue: byDay[d]?.revenue || 0, profit: byDay[d]?.profit || 0 });
  }
  return out;
}
