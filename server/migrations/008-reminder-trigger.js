export default async function migrate({ db }) {
  await db.prepare(
    `ALTER TABLE reminders ADD COLUMN trigger_type TEXT`
  ).run().catch(() => {});
}
