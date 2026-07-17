/**
 * Migration 011: Add ai_actions table for Two-Phase Confirmation & Context Grip pipeline
 * 
 * Stores pending actions that require user confirmation before execution.
 * Supports multilingual confirmation phrases and context grip tracking.
 */

export default async function migrate({ db }) {
  // Create ai_actions table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ai_actions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id         INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      intent          TEXT NOT NULL,
      action_payload  TEXT NOT NULL,           -- JSON string of the action payload
      requires_confirmation INTEGER NOT NULL DEFAULT 1,
      context_grip_key TEXT NOT NULL,          -- Unique key to track session context
      status          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | EXECUTED | CANCELLED | EXPIRED
      confirmation_phrase TEXT,               -- The phrase user said to confirm (yes/haan/avunu/saree/ok)
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      executed_at     TEXT,
      expires_at      TEXT NOT NULL DEFAULT (datetime('now', '+24 hours'))
    )
  `).run();

  // Index for fast lookup by shop and context grip key
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_ai_actions_shop_context 
    ON ai_actions(shop_id, context_grip_key, status)
  `).run();

  // Index for cleanup of expired actions
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_ai_actions_expires 
    ON ai_actions(expires_at, status)
  `).run();

  console.log('Created ai_actions table with indexes');
}