import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

const dataDir = path.resolve("server/data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "quizrush.db"));
db.pragma("foreign_keys = ON");

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      hint TEXT DEFAULT "",
      explanation_part1 TEXT DEFAULT "",
      explanation_part2 TEXT DEFAULT "",
      image TEXT,
      time_limit INTEGER DEFAULT 20,
      points INTEGER DEFAULT 1000
    );

    CREATE TABLE IF NOT EXISTS answer (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL
    );
  `);
}

init();

function ensureQuestionExplanation() {
  const columns = db.prepare("PRAGMA table_info(question)").all();
  const hasHint = columns.some((col) => col.name === "hint");
  const hasPart1 = columns.some((col) => col.name === "explanation_part1");
  const hasPart2 = columns.some((col) => col.name === "explanation_part2");
  if (!hasHint) db.exec('ALTER TABLE question ADD COLUMN hint TEXT DEFAULT ""');
  if (!hasPart1) db.exec('ALTER TABLE question ADD COLUMN explanation_part1 TEXT DEFAULT ""');
  if (!hasPart2) db.exec('ALTER TABLE question ADD COLUMN explanation_part2 TEXT DEFAULT ""');
}

ensureQuestionExplanation();

const fixedQuiz = {
  id: "fixed-quiz",
  title: "Quiz Sécurité",
  description: "Questions de sensibilisation.",
  cover_image: "",
  questions: [
    {
      text: "Bonjour — Pour dire bonjour, ton entraineur/animateur peut...",
      hint: "Ton corps t'appartient",
      explanation_part1: "Personne ne peut t'imposer un contact physique sans ton accord",
      explanation_part2: "Tu as le droit de dire non",
      image: "",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Te serrer contre lui", is_correct: false },
        { text: "Te serrer la main", is_correct: true },
        { text: "Te faire un check", is_correct: true },
        { text: "Te faire des bises", is_correct: false },
        { text: "Te dire bonjour/salut", is_correct: true }
      ]
    },
    {
      text: "Activités — Durant l'activité, mon entraîneur/animateur peut me dire...",
      hint: "Non aux discriminations",
      explanation_part1:
        "L'adulte doit encourager et peut uniquement faire des remarques sur ton activité et tes performances.",
      explanation_part2: "Il ne doit pas te dévaloriser",
      image: "",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Tu es très beau/belle", is_correct: false },
        { text: "Tu es trop gros/grosse", is_correct: false },
        { text: "C'est bien,tu progresses", is_correct: true },
        { text: "T'es moche avec tes boutons", is_correct: false },
        { text: "Soit plus concentré", is_correct: true },
        { text: "Ne t'inquiéte pas, tu vas y arriver", is_correct: true }
      ]
    },
    {
      text: "Aide — Besoin d'aide, connais-tu le numéro d'\"enfance en danger\" ?",
      hint: "Stop au silence ! Fais le 119",
      explanation_part1: "Si tu vis ou assistes à une situation anormale",
      explanation_part2: "Surtout n'hésite pas à appeler le 119",
      image: "",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "110", is_correct: false },
        { text: "119", is_correct: true },
        { text: "999", is_correct: false },
        { text: "09091", is_correct: false }
      ]
    }
  ]
};

function now() {
  return new Date().toISOString();
}

function listQuizzes() {
  return db.prepare("SELECT * FROM quiz ORDER BY updated_at DESC").all();
}

function quizCount() {
  return db.prepare("SELECT COUNT(*) as count FROM quiz").get().count;
}

function clearAll() {
  db.exec("DELETE FROM answer;");
  db.exec("DELETE FROM question;");
  db.exec("DELETE FROM quiz;");
}

function getQuiz(id) {
  const quiz = db.prepare("SELECT * FROM quiz WHERE id = ?").get(id);
  if (!quiz) return null;
  const questions = db
    .prepare("SELECT * FROM question WHERE quiz_id = ? ORDER BY order_index ASC")
    .all(id)
    .map((q) => ({ ...q, answers: [] }));

  const answerRows = db
    .prepare(
      "SELECT * FROM answer WHERE question_id IN (SELECT id FROM question WHERE quiz_id = ?) ORDER BY order_index ASC"
    )
    .all(id);

  const answersByQuestion = new Map();
  answerRows.forEach((a) => {
    if (!answersByQuestion.has(a.question_id)) answersByQuestion.set(a.question_id, []);
    answersByQuestion.get(a.question_id).push({
      id: a.id,
      text: a.text,
      is_correct: Boolean(a.is_correct),
      order_index: a.order_index
    });
  });

  const withAnswers = questions.map((q) => ({
    id: q.id,
    quiz_id: q.quiz_id,
    order_index: q.order_index,
    text: q.text,
    hint: q.hint || "",
    explanation_part1: q.explanation_part1 || "",
    explanation_part2: q.explanation_part2 || "",
    image: q.image,
    time_limit: q.time_limit,
    points: q.points,
    answers: answersByQuestion.get(q.id) || []
  }));

  return { ...quiz, questions: withAnswers };
}

function insertQuiz(quiz) {
  const quizId = quiz.id || nanoid();
  const timestamp = now();
  db.prepare(
    "INSERT INTO quiz (id, title, description, cover_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(quizId, quiz.title, quiz.description || "", quiz.cover_image || "", timestamp, timestamp);

  const insertQuestion = db.prepare(
    "INSERT INTO question (id, quiz_id, order_index, text, hint, explanation_part1, explanation_part2, image, time_limit, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertAnswer = db.prepare(
    "INSERT INTO answer (id, question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)"
  );

  quiz.questions.forEach((q, qIndex) => {
    const qId = q.id || nanoid();
    insertQuestion.run(
      qId,
      quizId,
      qIndex,
      q.text,
      q.hint || "",
      q.explanation_part1 || "",
      q.explanation_part2 || "",
      q.image || "",
      q.time_limit || 20,
      q.points || 1000
    );
    (q.answers || []).forEach((a, aIndex) => {
      insertAnswer.run(a.id || nanoid(), qId, a.text, a.is_correct ? 1 : 0, aIndex);
    });
  });

  return getQuiz(quizId);
}

function updateQuiz(id, quiz) {
  const timestamp = now();
  db.prepare("UPDATE quiz SET title = ?, description = ?, cover_image = ?, updated_at = ? WHERE id = ?").run(
    quiz.title,
    quiz.description || "",
    quiz.cover_image || "",
    timestamp,
    id
  );

  db.prepare("DELETE FROM answer WHERE question_id IN (SELECT id FROM question WHERE quiz_id = ?)").run(id);
  db.prepare("DELETE FROM question WHERE quiz_id = ?").run(id);

  const insertQuestion = db.prepare(
    "INSERT INTO question (id, quiz_id, order_index, text, hint, explanation_part1, explanation_part2, image, time_limit, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertAnswer = db.prepare(
    "INSERT INTO answer (id, question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)"
  );

  quiz.questions.forEach((q, qIndex) => {
    const qId = q.id || nanoid();
    insertQuestion.run(
      qId,
      id,
      qIndex,
      q.text,
      q.hint || "",
      q.explanation_part1 || "",
      q.explanation_part2 || "",
      q.image || "",
      q.time_limit || 20,
      q.points || 1000
    );
    (q.answers || []).forEach((a, aIndex) => {
      insertAnswer.run(a.id || nanoid(), qId, a.text, a.is_correct ? 1 : 0, aIndex);
    });
  });

  return getQuiz(id);
}

function deleteQuiz(id) {
  db.prepare("DELETE FROM quiz WHERE id = ?").run(id);
}

function duplicateQuiz(id) {
  const quiz = getQuiz(id);
  if (!quiz) return null;
  const copy = {
    ...quiz,
    id: nanoid(),
    title: `${quiz.title} (Copy)`,
    questions: quiz.questions.map((q) => ({
      ...q,
      id: nanoid(),
      answers: q.answers.map((a) => ({ ...a, id: nanoid() }))
    }))
  };
  return insertQuiz(copy);
}

function exportQuiz(id) {
  return getQuiz(id);
}

function importQuiz(payload) {
  const quiz = {
    title: payload.title,
    description: payload.description,
    cover_image: payload.cover_image,
    questions: payload.questions || []
  };
  return insertQuiz(quiz);
}

export {
  listQuizzes,
  quizCount,
  getQuiz,
  insertQuiz,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  exportQuiz,
  importQuiz
};

const count = quizCount();
const fixedExists = getQuiz("fixed-quiz");
if (count === 0) {
  insertQuiz(fixedQuiz);
} else if (count !== 1 || !fixedExists) {
  clearAll();
  insertQuiz(fixedQuiz);
} else {
  const updateQuestion = db.prepare(
    "UPDATE question SET hint = ?, explanation_part1 = ?, explanation_part2 = ? WHERE quiz_id = ? AND order_index = ?"
  );
  fixedQuiz.questions.forEach((q, idx) => {
    updateQuestion.run(
      q.hint || "",
      q.explanation_part1 || "",
      q.explanation_part2 || "",
      "fixed-quiz",
      idx
    );
  });
}
