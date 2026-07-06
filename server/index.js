import express from "express";
import cors from "cors";
import { config, flags, logStartupFlags } from "./config.js";
import "./db.js"; // initialize schema on boot
import { authRouter } from "./routes/auth.js";
import { dataRouter } from "./routes/data.js";
import { simulateRouter } from "./routes/simulate.js";
import { whatsappRouter } from "./routes/whatsapp.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Twilio posts form-encoded

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, integrations: flags }),
);

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dataRouter);
app.use("/api/simulate", simulateRouter);
app.use("/webhooks", whatsappRouter);

app.listen(config.port, () => {
  console.log(`\n🟢 Dukaan Saathi backend on http://localhost:${config.port}`);
  logStartupFlags();
  console.log("");
});
