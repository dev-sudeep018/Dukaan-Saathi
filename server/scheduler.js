import { db } from "./db.js";

function generateMessage(customerName, shopName, amountStr, due_date, upiLink) {
  return `Hello ${customerName},

This is a friendly reminder from ${shopName || "our shop"}.

Your pending Udhaar balance is ${amountStr}.
Due Date: ${due_date}

${upiLink ? `Please complete your payment using this UPI link:\n${upiLink}\n\n` : `Please complete your payment using UPI.\n\n`}Thank you for shopping with us.`;
}

export function startScheduler() {
  console.log("⏰ Starting automated reminder scheduler...");

  // Run immediately on start, then every 24 hours
  checkReminders();
  setInterval(checkReminders, 24 * 60 * 60 * 1000);
}

async function checkReminders() {
  try {
    // Get all customers with a due_date and outstanding balance
    const customers = await db.prepare(`
      SELECT 
        c.id, c.shop_id, c.name, c.phone, c.upi_id, c.due_date,
        s.name as shop_name,
        (COALESCE((SELECT SUM(amount) FROM sales WHERE customer_id = c.id AND payment_type = 'udhaar'), 0) - 
         COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id), 0)) AS outstanding
      FROM customers c
      JOIN shops s ON c.shop_id = s.id
      WHERE c.due_date IS NOT NULL
    `).all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const c of customers) {
      if (c.outstanding <= 0) continue;

      const dueDate = new Date(c.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // negative = before due date

      let triggerType = null;
      if (diffDays === -3) {
        triggerType = "3_days_before";
      } else if (diffDays === 0) {
        triggerType = "on_due_date";
      } else if (diffDays > 0 && diffDays % 7 === 0) {
        triggerType = `7_days_after_${diffDays}`;
      }

      if (triggerType) {
        // Avoid duplicate: check if reminder already generated for this trigger
        const existing = await db.prepare(`
          SELECT id FROM reminders 
          WHERE customer_id = ? AND trigger_type = ?
        `).get(c.id, triggerType);

        if (!existing) {
          let upiLink = "";
          if (c.upi_id) {
            upiLink = `upi://pay?pa=${c.upi_id.trim()}&pn=${encodeURIComponent(c.shop_name || "Shop")}&am=${c.outstanding}`;
          }

          const amountStr = `₹${c.outstanding}`;
          const msg = generateMessage(c.name, c.shop_name, amountStr, c.due_date, upiLink);

          await db.prepare(`
            INSERT INTO reminders (shop_id, customer_id, message, amount, sent_via, status, trigger_type)
            VALUES (?, ?, ?, ?, 'scheduled', 'pending', ?)
          `).run(c.shop_id, c.id, msg, c.outstanding, triggerType);

          console.log(`✅ Generated "${triggerType}" reminder for customer ${c.id} (${c.name})`);
        }
      }
    }
  } catch (err) {
    console.error("Scheduler error:", err);
  }
}
