import { createClient } from "@libsql/client";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Connection. In production TURSO_DATABASE_URL points at a Turso/libSQL cloud
   database (with an auth token). With no URL set we fall back to a local SQLite
   file so local dev / tests need no cloud account — same code path either way. */
let url = config.turso.url;
let authToken = config.turso.authToken || undefined;
if (!url) {
  // DATA_DIR lets a host mount a disk; otherwise <server>/data. Only used for
  // the local file fallback — the cloud path ignores it.
  const dataDir = process.env.DATA_DIR || join(__dirname, "data");
  mkdirSync(dataDir, { recursive: true });
  // libSQL file: URLs want forward slashes even on Windows (C:\a\b -> C:/a/b).
  url = "file:" + join(dataDir, "dukaan.db").replace(/\\/g, "/");
  authToken = undefined;
}

const client = createClient({ url, authToken });

/* ---- better-sqlite3-shaped async adapter ---------------------------------
   Mirrors the tiny slice of the better-sqlite3 API this app uses, but every
   call returns a Promise. Call sites keep their SQL verbatim (libSQL speaks the
   same SQLite dialect) and just `await` the result. */
const stmt = (sql) => ({
  get: async (...args) => (await client.execute({ sql, args })).rows[0],
  all: async (...args) => (await client.execute({ sql, args })).rows,
  run: async (...args) => {
    const r = await client.execute({ sql, args });
    return {
      lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : undefined,
      changes: r.rowsAffected,
    };
  },
});

export const db = {
  prepare: stmt,
  /* Run several statements atomically. Each item is { sql, args }. */
  batch: (statements) => client.batch(statements, "write"),
};

/* ---- Schema (idempotent) -------------------------------------------------- */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS shops (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL DEFAULT 'My Shop',
  whatsapp_number TEXT UNIQUE NOT NULL,
  pin_hash       TEXT,
  lang_pref      TEXT NOT NULL DEFAULT 'en',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id    INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  name_norm  TEXT NOT NULL,
  unit       TEXT DEFAULT 'unit',
  stock_qty  REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  sell_price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id, name_norm);

CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id    INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  name_norm  TEXT NOT NULL,
  phone      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id, name_norm);

CREATE TABLE IF NOT EXISTS sales (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id      INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  item_text    TEXT NOT NULL,
  qty          REAL NOT NULL DEFAULT 1,
  unit_price   REAL NOT NULL DEFAULT 0,
  amount       REAL NOT NULL DEFAULT 0,
  cost_amount  REAL NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash',      -- cash | udhaar
  customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_shop ON sales(shop_id, created_at);

CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  amount      REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id, created_at);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category    TEXT NOT NULL DEFAULT 'misc', -- rent | transport | supplies | misc ...
  note        TEXT,
  amount      REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id     INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  direction   TEXT NOT NULL,        -- in | out
  channel     TEXT NOT NULL,        -- whatsapp | sim
  raw_text    TEXT,
  transcript  TEXT,
  lang        TEXT,
  intent      TEXT,
  parsed_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_shop ON messages(shop_id, created_at);
`;

/* Resolves once the schema exists. Boot code (index.js) and scripts await this
   before serving/using the DB. */
export const dbReady = client.executeMultiple(SCHEMA);

/* ---- Helpers -------------------------------------------------------------- */
export const normalize = (s) =>
  (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

/* Find a shop by WhatsApp number, or create one on first contact. */
export async function getOrCreateShop(whatsappNumber, name = "My Shop") {
  const number = whatsappNumber.replace(/^whatsapp:/, "");
  let shop = await db
    .prepare("SELECT * FROM shops WHERE whatsapp_number = ?")
    .get(number);
  if (!shop) {
    const info = await db
      .prepare("INSERT INTO shops (name, whatsapp_number) VALUES (?, ?)")
      .run(name, number);
    shop = await db.prepare("SELECT * FROM shops WHERE id = ?").get(info.lastInsertRowid);
  }
  return shop;
}

export async function getShopById(id) {
  return db.prepare("SELECT * FROM shops WHERE id = ?").get(id);
}
