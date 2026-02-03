import { Router } from "express";
import { listQuizzes, getQuiz, exportQuiz } from "../db/index.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(listQuizzes());
});

router.post("/", (req, res) => {
  res.status(403).send("Quiz creation disabled");
});

router.get("/:id", (req, res) => {
  const quiz = getQuiz(req.params.id);
  if (!quiz) return res.status(404).send("Quiz not found");
  res.json(quiz);
});

router.put("/:id", (req, res) => {
  res.status(403).send("Quiz editing disabled");
});

router.delete("/:id", (req, res) => {
  res.status(403).send("Quiz deletion disabled");
});

router.post("/:id/duplicate", (req, res) => {
  res.status(403).send("Quiz duplication disabled");
});

router.get("/:id/export", (req, res) => {
  const quiz = exportQuiz(req.params.id);
  if (!quiz) return res.status(404).send("Quiz not found");
  res.json(quiz);
});

router.post("/import", (req, res) => {
  res.status(403).send("Quiz import disabled");
});

export default router;
