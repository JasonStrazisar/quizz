import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const adminPassword = process.env.ADMIN_PASSWORD || "change-me";
const adminHash = bcrypt.hashSync(adminPassword, 10);

router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).send("Password required");

  const ok = await bcrypt.compare(password, adminHash);
  if (!ok) return res.status(401).send("Invalid credentials");

  const secret = process.env.JWT_SECRET || "change-me";
  const token = jwt.sign({ role: "host" }, secret, { expiresIn: "7d" });
  return res.json({ token });
});

export default router;
