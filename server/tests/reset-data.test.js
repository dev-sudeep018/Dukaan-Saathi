import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "dukaan-reset-data-"));
process.env.DATA_DIR = tempDir;

const { dbReady, db, createOwnerProfile } = await import("../db.js");
const { clearShopData } = await import("../lib/seed.js");

test("resets shop business data while preserving login credentials and cross-shop isolation", async () => {
  await dbReady;

  // Create owner/shop 1
  const owner1 = await createOwnerProfile({
    shop_name: "Reset Shop 1",
    owner_name: "Owner One",
    mobile_number: "+919999900001",
    email: "owner1@example.com",
    shop_address: "Hyderabad",
    shop_logo: "",
    pin: "1111",
    lang: "en",
  });

  const shop1 = await db.prepare("SELECT * FROM shops WHERE owner_id = ?").get(owner1.id);
  assert.ok(shop1);

  // Create owner/shop 2
  const owner2 = await createOwnerProfile({
    shop_name: "Reset Shop 2",
    owner_name: "Owner Two",
    mobile_number: "+919999900002",
    email: "owner2@example.com",
    shop_address: "Delhi",
    shop_logo: "",
    pin: "2222",
    lang: "en",
  });

  const shop2 = await db.prepare("SELECT * FROM shops WHERE owner_id = ?").get(owner2.id);
  assert.ok(shop2);

  // Insert business data for Shop 1
  await db.prepare(`
    INSERT INTO sales (shop_id, item_text, qty, unit_price, amount, payment_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(shop1.id, "soap", 5, 20, 100, "cash");

  // Insert business data for Shop 2
  await db.prepare(`
    INSERT INTO sales (shop_id, item_text, qty, unit_price, amount, payment_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(shop2.id, "shampoo", 3, 50, 150, "cash");

  // Verify initial data in DB
  const salesShop1Before = await db.prepare("SELECT * FROM sales WHERE shop_id = ?").get(shop1.id);
  assert.ok(salesShop1Before);

  const salesShop2Before = await db.prepare("SELECT * FROM sales WHERE shop_id = ?").get(shop2.id);
  assert.ok(salesShop2Before);

  // Execute reset for Shop 1 only
  await clearShopData(shop1.id);

  // Verify Shop 1's business data is deleted
  const salesShop1After = await db.prepare("SELECT * FROM sales WHERE shop_id = ?").get(shop1.id);
  assert.equal(salesShop1After, undefined);

  // Verify Shop 2's business data remains intact (cross-shop isolation)
  const salesShop2After = await db.prepare("SELECT * FROM sales WHERE shop_id = ?").get(shop2.id);
  assert.ok(salesShop2After);
  assert.equal(salesShop2After.item_text, "shampoo");

  // Verify login accounts are NOT deleted
  const ownerAccount1 = await db.prepare("SELECT * FROM owner_profiles WHERE id = ?").get(owner1.id);
  assert.ok(ownerAccount1);
  assert.equal(ownerAccount1.email, "owner1@example.com");

  const shopAccount1 = await db.prepare("SELECT * FROM shops WHERE id = ?").get(shop1.id);
  assert.ok(shopAccount1);

  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});
