import { customAlphabet } from "nanoid";
import { getQuiz } from "../db/index.js";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const sessions = new Map();

function createSession(quizId, hostSocketId) {
  const quiz = getQuiz(quizId);
  if (!quiz) return null;
  const code = nanoid();
  const session = {
    id: code,
    code,
    quizId,
    quiz,
    hostSocketId,
    players: new Map(),
    phase: "lobby",
    currentQuestionIndex: 0,
    questionStartTime: null,
    timeLimit: 0,
    answeredCount: 0,
    distribution: [],
    leaderboard: [],
    timer: null,
    results: []
  };
  sessions.set(code, session);
  return session;
}

function getSession(code) {
  return sessions.get(code);
}

function removeSession(code) {
  const session = sessions.get(code);
  if (session?.timer) clearTimeout(session.timer);
  sessions.delete(code);
}

function listActiveSessionByQuiz(quizId) {
  for (const session of sessions.values()) {
    if (session.quizId === quizId) return session;
  }
  return null;
}

function assignNickname(session, nickname) {
  let name = nickname.trim() || "Player";
  const existing = new Set(Array.from(session.players.values()).map((p) => p.nickname));
  if (!existing.has(name)) return name;
  let counter = 2;
  while (existing.has(`${name} ${counter}`)) counter += 1;
  return `${name} ${counter}`;
}

function ensurePlayer(session, socketId, nickname) {
  const existing = Array.from(session.players.entries()).find(([, p]) => p.nickname === nickname);
  if (existing) {
    const [oldSocketId, player] = existing;
    session.players.delete(oldSocketId);
    session.players.set(socketId, { ...player, connected: true });
    return session.players.get(socketId);
  }

  const colorIndex = session.players.size % 4;
  const colors = ["bg-accent-red", "bg-accent-blue", "bg-accent-green", "bg-accent-yellow"];
  const player = {
    nickname: assignNickname(session, nickname),
    color: colors[colorIndex],
    score: 0,
    answers: [],
    connected: true
  };
  session.players.set(socketId, player);
  return player;
}

function leaderboardFor(session) {
  return Array.from(session.players.values())
    .map((p) => ({ nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function fullLeaderboard(session) {
  return Array.from(session.players.values())
    .map((p) => ({ nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

function buildStats(session) {
  const totalQuestions = session.quiz.questions.length || 1;
  return Array.from(session.players.values()).map((p) => {
    const correct = p.answers.filter((a) => a.correct).length;
    const avgTime =
      p.answers.length > 0
        ? p.answers.reduce((sum, a) => sum + a.time, 0) / p.answers.length
        : 0;
    return {
      nickname: p.nickname,
      score: p.score,
      accuracy: Math.round((correct / totalQuestions) * 100),
      avgResponseTime: Number(avgTime.toFixed(2))
    };
  });
}

function startQuestion(session, io) {
  const question = session.quiz.questions[session.currentQuestionIndex];
  if (!question) return null;

  session.phase = "question";
  session.questionStartTime = Date.now();
  session.timeLimit = 30;
  session.answeredCount = 0;
  session.distribution = question.answers.map((answer) => ({
    answerId: answer.id,
    text: answer.text,
    count: 0,
    percent: 0
  }));

  const payload = {
    question: {
      id: question.id,
      text: question.text,
      hint: question.hint || "",
      explanation_part1: question.explanation_part1 || "",
      explanation_part2: question.explanation_part2 || "",
      image: question.image,
      time_limit: 30,
      points: question.points,
      index: session.currentQuestionIndex,
      total: session.quiz.questions.length
    },
    answers: question.answers.map((a) => ({ id: a.id, text: a.text })),
    index: session.currentQuestionIndex,
    total: session.quiz.questions.length
  };

  io.to(session.code).emit("game:question", payload);

  if (session.timer) clearTimeout(session.timer);
  session.timer = setTimeout(() => {
    if (session.phase === "question") endQuestion(session, io);
  }, session.timeLimit * 1000);

  return payload;
}

function endQuestion(session, io) {
  if (session.phase !== "question") return;
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }
  session.phase = "explanation";
  const question = session.quiz.questions[session.currentQuestionIndex];
  const correctAnswers = question.answers.filter((a) => a.is_correct).map((a) => a.text);
  io.to(session.code).emit("game:explanation", {
    correctAnswers,
    hint: question.hint || "",
    part1: question.explanation_part1 || "",
    part2: question.explanation_part2 || ""
  });
}

function getCorrectAnswerId(session) {
  const question = session.quiz.questions[session.currentQuestionIndex];
  const correct = question.answers.find((a) => a.is_correct);
  return correct?.id || null;
}

function answerQuestion(session, socketId, answerIds, io) {
  if (session.phase !== "question") return null;
  const player = session.players.get(socketId);
  if (!player) return null;
  if (player.answers.some((a) => a.questionId === session.quiz.questions[session.currentQuestionIndex].id)) {
    return null;
  }

  const question = session.quiz.questions[session.currentQuestionIndex];
  const validIds = new Set(question.answers.map((a) => a.id));
  const uniqueSelected = Array.from(new Set(Array.isArray(answerIds) ? answerIds : []));
  const selected = uniqueSelected.filter((id) => validIds.has(id));
  const correctIds = question.answers.filter((a) => a.is_correct).map((a) => a.id);
  const correctSet = new Set(correctIds);
  const selectedSet = new Set(selected);

  const correct =
    selected.length > 0 &&
    selected.length === correctIds.length &&
    selected.every((id) => correctSet.has(id));

  const elapsed = (Date.now() - session.questionStartTime) / 1000;
  const timeRemaining = Math.max(0, session.timeLimit - elapsed);
  const speedBonus = Math.max(0, (timeRemaining / session.timeLimit) * 0.5);
  const score = correct ? Math.round(question.points * (1 + speedBonus)) : 0;

  player.score += score;
  player.answers.push({ questionId: question.id, answerIds: selected, correct, score, time: elapsed });

  session.answeredCount += 1;
  selectedSet.forEach((id) => {
    const distItem = session.distribution.find((d) => d.answerId === id);
    if (distItem) distItem.count += 1;
  });

  const connectedCount = Array.from(session.players.values()).filter((p) => p.connected !== false).length;
  if (connectedCount > 0 && session.answeredCount >= connectedCount) {
    endQuestion(session, io);
  }

  const rank = fullLeaderboard(session).findIndex((p) => p.nickname === player.nickname) + 1;
  return { correct, score, rank };
}

function nextQuestion(session, io) {
  if (session.phase === "question") {
    endQuestion(session, io);
    return;
  }
  if (session.phase === "explanation") {
    session.phase = "results";
    const connectedCount = Array.from(session.players.values()).filter((p) => p.connected !== false).length;
    const totalPlayers = connectedCount || 1;
    session.distribution = session.distribution.map((item) => ({
      ...item,
      percent: Math.round((item.count / totalPlayers) * 100)
    }));

    const leaderboard = leaderboardFor(session);
    session.leaderboard = leaderboard;

    io.to(session.code).emit("game:question-results", {
      correctAnswerId: getCorrectAnswerId(session),
      distribution: session.distribution,
      leaderboard
    });
    return;
  }
  if (session.phase === "results") {
    session.currentQuestionIndex += 1;
    if (session.currentQuestionIndex >= session.quiz.questions.length) {
      session.phase = "final";
      const leaderboard = fullLeaderboard(session);
      const stats = buildStats(session);
      session.results = { leaderboard, stats };
      io.to(session.code).emit("game:final-results", {
        leaderboard,
        stats
      });
      return;
    }
    startQuestion(session, io);
  }
}

export {
  sessions,
  createSession,
  getSession,
  removeSession,
  listActiveSessionByQuiz,
  ensurePlayer,
  leaderboardFor,
  startQuestion,
  endQuestion,
  answerQuestion,
  nextQuestion,
  buildStats
};
