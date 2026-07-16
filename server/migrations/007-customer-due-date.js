export default async function migrate({ db }) {
  await db.prepare(
    `ALTER TABLE customers ADD COLUMN due_date TEXT`
  ).run().catch(() => {});
}
