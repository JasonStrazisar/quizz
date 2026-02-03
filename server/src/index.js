import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quizzes.js";
import sessionRoutes from "./routes/sessions.js";
import { authRequired } from "./middleware/auth.js";
import registerSocket from "./socket/index.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", authRequired, quizRoutes);
app.use("/api/sessions", authRequired, sessionRoutes);

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

registerSocket(io);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
}
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
}

server.listen(PORT, () => {
  console.log(`QuizRush server running on :${PORT}`);
});
