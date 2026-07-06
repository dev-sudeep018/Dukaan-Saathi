/* Smoke test for the message pipeline — no external keys required (uses the
   rule-based mock parser when ANTHROPIC_API_KEY is unset). Run: npm run test:pipeline */
import { getOrCreateShop, db } from "../db.js";
import { handleMessage } from "../lib/pipeline.js";
import { todaySummary, totalDues, todayExpenses } from "../lib/queries.js";

const shop = getOrCreateShop("+19999999999", "Test Shop");
// clean slate for this test shop
db.prepare("DELETE FROM sales WHERE shop_id = ?").run(shop.id);
db.prepare("DELETE FROM payments WHERE shop_id = ?").run(shop.id);
db.prepare("DELETE FROM expenses WHERE shop_id = ?").run(shop.id);
db.prepare("DELETE FROM products WHERE shop_id = ?").run(shop.id);
db.prepare("DELETE FROM customers WHERE shop_id = ?").run(shop.id);

const messages = [
  "2 kg rice 100 rupees cash",
  "Ramesh 3 kg sugar 150 udhaar",
  "Ramesh paid 50",
  "10 kg atta aaya",
  "rent 5000 kharch",
  "chai 40 kharcha",
  "aaj kitna kharch hua",
  "aaj ka profit kitna hua",
  "kitne paise aaye aaj",
  "kaun kaun ka udhaar baaki hai",
  "क्या क्या खतम हो रहा है",
  "ఈ రోజు అమ్మకాలు ఎంత",
  "aaj ka hisab",
  "undo",
];

console.log("\n=== Dukaan Saathi pipeline smoke test ===\n");
for (const text of messages) {
  const out = await handleMessage({ shop, text, channel: "sim" });
  console.log(`IN  (${out.language}) : ${text}`);
  console.log(`OUT [${out.intent}] : ${out.reply.replace(/\n/g, " / ")}`);
  console.log("");
}

console.log("--- Final state ---");
console.log("Today summary:", todaySummary(shop.id));
console.log("Expenses:", JSON.stringify(todayExpenses(shop.id)));
console.log("Dues:", JSON.stringify(totalDues(shop.id)));
console.log("\n(If Claude were enabled, parsing accuracy — especially Telugu — would be much higher.)\n");
process.exit(0);
