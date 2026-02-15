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
      text: "Dans quels cas il n’y a pas de consentement lors d’un acte sexuel ?",
      hint: "Respect",
      explanation_part1: "Le consentement doit être libre, éclairé et sans contrainte.",
      explanation_part2: "La peur, la pression, le silence ambigu ou l’alcool/drogue empêchent un consentement valable.",
      image: "consent_conditions_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "La peur et la surprise", is_correct: true },
        { text: "Le chantage et la pression", is_correct: true },
        { text: "Le silence et le ni 'oui-ni non'", is_correct: true },
        { text: "Le oui réciproque", is_correct: false },
        { text: "La drogue et l’alcool", is_correct: true }
      ]
    },
    {
      text: "Quel est l’âge du consentement sexuel ?",
      hint: "Moins de 15 ans, c’est non",
      explanation_part1: "Avant 15 ans, la loi considère que tu es trop jeune pour dire OUI.",
      explanation_part2: "Après 15 ans, les rapports sexuels sont autorisés sauf si l’adulte a une relation d’autorité sur toi.",
      image: "age_of_consent_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "12 ans", is_correct: false },
        { text: "15 ans", is_correct: true },
        { text: "18 ans", is_correct: false },
        { text: "20 ans", is_correct: false }
      ]
    },
    {
      text: "Une fille peut-elle faire du sport quand elle a ses règles ?",
      hint: "Non aux discriminations",
      explanation_part1: "Oui ! Les filles peuvent faire du sport pendant leurs règles.",
      explanation_part2: "Cela peut demander un effort supplémentaire. Si tu es concernée, tu peux demander un aménagement ; l’entraîneur doit te respecter.",
      image: "periods_sport_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: true },
        { text: "Non", is_correct: false }
      ]
    },
    {
      text: "Pour rigoler, as-tu le droit de mettre un doigt dans les fesses d’un copain ou d’une copine même à travers les vêtements ?",
      hint: "Ton corps t'appartient",
      explanation_part1: "Personne n’a le droit de toucher tes parties intimes sans ton consentement même pour jouer.",
      explanation_part2: "C’est puni par la loi.",
      image: "intimate_touch_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: false },
        { text: "Non", is_correct: true }
      ]
    },
    {
      text: "Pour faire partie d’un groupe, es-tu obligé de boire relever un défi, ou de te laisser humilier  ?",
      hint: "Stop au bizutage",
      explanation_part1: "Obliger une personne à réaliser une action pour intégrer un groupe est un bizutage.",
      explanation_part2: "C’est puni par la loi. Il n’y a pas de bizutage gentil.",
      image: "hazing_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: false },
        { text: "Non", is_correct: true }
      ]
    },
    {
      text: "Dans un groupe, tu entends une personne dire : « C'est une fille, elle est forcèment nulle, la lutte c'est pour les hommes. » Quelle est ta réaction ?",
      hint: "Non aux discriminations",
      explanation_part1: "Le mieux est l’argumentation pour expliquer pourquoi cette remarque est sexiste.",
      explanation_part2: "Il est important de donner son avis quand le groupe raconte n’importe quoi.",
      image: "sexist_remark_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Tu laisses dire", is_correct: false },
        { text: "Tu rajoutes une remarque", is_correct: false },
        { text: "Tu interviens en changeant de sujet", is_correct: false },
        { text: "Tu fais une blague en rigolant", is_correct: false },
        { text: "Tu argumentes pour contrer", is_correct: true }
      ]
    },
    {
      text: "As-tu le droit de dire ou d’écrire à une personne « T’es triso », « T’es fraiche », « Tapette », « Sale juif », « Gros tas », « Bigleux » ?",
      hint: "Non aux discriminations",
      explanation_part1: "Tu n’as pas le droit de les dire, et personne n’a le droit de te les dire.",
      explanation_part2: "Ce sont des propos injurieux, racistes, antisémites, homophobes et sexistes. C’est puni par la loi.",
      image: "discriminatory_words_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: false },
        { text: "Non", is_correct: true }
      ]
    },
    {
      text: "Un camarade profite des réseaux sociaux pour : t’insulter, te menacer, t’envoyer des messages/images humiliants, diffuser des photos de toi dénudé sans ton accord. Que fais-tu ?",
      hint: "Ne reste pas seul",
      explanation_part1: "Le mieux est d’en parler à une personne de confiance.",
      explanation_part2: "Contacte le 3018 via le tchat. Gratuit – Anonyme – Confidentiel.",
      image: "cyberbullying_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Tu as peur", is_correct: false },
        { text: "Tu arrêtes l’activité", is_correct: true },
        { text: "Tu t’isoles et tu pleures", is_correct: false },
        { text: "Tu te venges", is_correct: false },
        { text: "Tu en parles à une personne de confiance", is_correct: true }
      ]
    },
    {
      text: "Si je dois rentrer chez moi en voiture avec mon entraîneur/animateur, je m’assoie :",
      hint: "Ton corps t'appartient",
      explanation_part1: "Pour ta sécurité et éviter les gestes malveillants, il est préférable de t’asseoir à l’arrière.",
      explanation_part2: "N’oublie pas de boucler ta ceinture !",
      image: "car_back_seat_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "À l’avant, à côté du conducteur", is_correct: false },
        { text: "À l’arrière", is_correct: true },
        { text: "Dans le coffre", is_correct: false }
      ]
    },  
    {
      text: "Peux-tu rester seul dans les vestiaires avec un adulte ?",
      hint: "Ton corps t'appartient",
      explanation_part1: "Un adulte n’a pas à être présent seul avec un jeune, dans les vestiaires ou sous la douche. Sauf en cas d’accident.",
      explanation_part2: "Pour se confier ou lors d’un entretien, c’est mieux de se rencontrer dans un bureau entrouvert.",
      image: "vestiaires_lockers_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: false },
        { text: "Non", is_correct: true }
      ]
    },
    {
      text: "Peux-tu, après l’entraînement ou le match, prendre une douche avec ton maillot de bain ?",
      hint: "Ton corps t'appartient",
      explanation_part1: "Ta nudité et ta pudeur t’appartiennent.",
      explanation_part2: "Personne ne peut te forcer à prendre une douche nu. N’oublie pas ta serviette : ta nudité peut gêner un copain et elle te protège aussi des photos envoyées sur internet.",
      image: "shower_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: true },
        { text: "Non", is_correct: false }
      ]
    },
    {
      text: "Sous prétexte de te motiver, ton entraîneur/animateur te pousse : « Mais t’es faible », « Que t’es nul-le », « Tu me déçois, je pensais que tu étais plus fort-e »… Comment réagis-tu ?",
      hint: "Non au harcèlement",
      explanation_part1: "Pour te faire réagir et te motiver, il-elle aurait pu t’encourager plutôt que t’abaisser car tu te sens blessé-e qu’il-elle ait pu penser ça de toi.",
      explanation_part2: "Abaisser, humilier, de façon répétée est interdit par la loi. C’est du harcèlement moral.",
      image: "running_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Tu t’élances et tu lui montres le contraire", is_correct: false },
        { text: "Tu as peur et tu perds tes moyens, résultat tu fais n’importe quoi", is_correct: true }
      ]
    },
    {
      text: "Sans mon accord, mon entraîneur/animateur peut-il m’imposer une aide par contact physique ?",
      hint: "Ton corps t'appartient",
      explanation_part1: "L’adulte, pour des raisons techniques et de sécurité doit te demander ton accord et t’expliquer comment il va te tenir.",
      explanation_part2: "Tu as le droit de refuser et de dialoguer car tu peux être mal à l’aise avec ce contact.",
      image: "wrestling_support_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Oui", is_correct: false },
        { text: "Non", is_correct: true }
      ]
    },
    {
      text: "Ton entraîneur/animateur te demande de poursuivre ton entraînement alors que tu as mal, parce que tu t’es blessé-e, et contre l’avis médical. Que fais-tu ?",
      hint: "Ton corps t'appartient",
      explanation_part1: "C’est important de respecter ton corps et l’avis médical.",
      explanation_part2: "Ce n’est pas être faible que de respecter ton corps et l’avis médical. Cela te permettra de revenir plus fort encore après la guérison.",
      image: "injury_medical_scene",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "Tu continues à t’entraîner malgré la douleur parce que l’entraîneur te le demande", is_correct: false },
        { text: "Tu dis non et tu demandes un autre programme adapté à tes douleurs et ta blessure", is_correct: true }
      ]
    },
    {
      text: "Besoin d’aide, connais-tu le numéro d’« enfance en danger » ?",
      hint: "Stop au silence ! Fais le 119",
      explanation_part1: "Si tu vis ou assistes à une situation anormale",
      explanation_part2: "Surtout n’hésite pas à appeler le 119. Gratuit – Anonyme – Confidentiel. Tu auras des conseils et de l’aide.",
      image: "119_help_screen",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "110", is_correct: false },
        { text: "119", is_correct: true },
        { text: "999", is_correct: false },
        { text: "09091", is_correct: false }
      ]
    },
    {
      text: "Voici des parties de ton corps. Trouve celles que personne n’a le droit de toucher !",
      hint: "Ton corps t'appartient",
      explanation_part1: "Toucher tes parties intimes sans ton accord est interdit.",
      explanation_part2: "C’est puni par la loi.",
      image: "body_parts_selection",
      time_limit: 20,
      points: 1000,
      answers: [
        { text: "La bouche", is_correct: true },
        { text: "Les pieds", is_correct: false },
        { text: "L’entrejambe", is_correct: true },
        { text: "Le sexe", is_correct: true },
        { text: "Les fesses", is_correct: true },
        { text: "La poitrine", is_correct: true },
        { text: "Le bas ventre", is_correct: true },
        { text: "Les oreilles", is_correct: false }
      ]
    },  
    {
      text: "Durant l'activité, mon entraîneur/animateur peut me dire...",
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
      text: "Pour dire bonjour, ton entraineur/animateur peut...",
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
      quiz.questions.length - 1 - qIndex,
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
      quiz.questions.length - 1 - qIndex,
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
  clearAll();
  insertQuiz(fixedQuiz);
}
