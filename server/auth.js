import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { getShopById } from "./db.js";

export const hashPin = (pin) => bcrypt.hashSync(String(pin), 10);
export const verifyPin = (pin, hash) =>
  hash ? bcrypt.compareSync(String(pin), hash) : false;

export function issueToken(shop) {
  return jwt.sign({ shopId: shop.id }, config.jwtSecret, { expiresIn: "7d" });
}

/* Express middleware — attaches req.shop for protected dashboard routes. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const { shopId } = jwt.verify(token, config.jwtSecret);
    const shop = getShopById(shopId);
    if (!shop) return res.status(401).json({ error: "Shop not found" });
    req.shop = shop;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
