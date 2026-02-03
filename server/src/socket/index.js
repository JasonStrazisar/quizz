import {
  answerQuestion,
  createSession,
  ensurePlayer,
  getSession,
  listActiveSessionByQuiz,
  nextQuestion,
  removeSession,
  startQuestion
} from "../services/sessionService.js";

export default function registerSocket(io) {
  io.on("connection", (socket) => {
    socket.on("host:create-session", ({ quizId }) => {
      const byCode = getSession(quizId);
      if (byCode) {
        socket.join(byCode.code);
        socket.emit("session:created", { sessionId: byCode.id, code: byCode.code });
        return;
      }
      const existing = listActiveSessionByQuiz(quizId);
      if (existing) {
        socket.join(existing.code);
        socket.emit("session:created", { sessionId: existing.id, code: existing.code });
        return;
      }
      const session = createSession(quizId, socket.id);
      if (!session) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }
      socket.join(session.code);
      socket.emit("session:created", { sessionId: session.id, code: session.code });
    });

    socket.on("player:join", ({ code, nickname }) => {
      const session = getSession(code);
      if (!session) {
        socket.emit("error", { message: "Session not available" });
        return;
      }

      const existing = Array.from(session.players.values()).some((p) => p.nickname === nickname);
      if (session.phase !== "lobby" && !existing) {
        socket.emit("error", { message: "Game already started" });
        return;
      }

      const player = ensurePlayer(session, socket.id, nickname);
      socket.join(code);
      io.to(code).emit("session:player-joined", {
        nickname: player.nickname,
        playerCount: session.players.size,
        color: player.color
      });

      if (session.phase === "question") {
        const question = session.quiz.questions[session.currentQuestionIndex];
        socket.emit("game:question", {
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
        });
      }

      if (session.phase === "results") {
        const question = session.quiz.questions[session.currentQuestionIndex];
        const correct = question.answers.find((a) => a.is_correct);
        socket.emit("game:question-results", {
          correctAnswerId: correct?.id || null,
          distribution: session.distribution,
          leaderboard: session.leaderboard
        });
      }

      if (session.phase === "explanation") {
        const question = session.quiz.questions[session.currentQuestionIndex];
        socket.emit("game:explanation", {
          correctAnswers: question.answers.filter((a) => a.is_correct).map((a) => a.text),
          hint: question.hint || "",
          part1: question.explanation_part1 || "",
          part2: question.explanation_part2 || ""
        });
      }
    });

    socket.on("host:start-game", ({ code }) => {
      const session = getSession(code);
      if (!session) return;
      startQuestion(session, io);
    });

    socket.on("host:next-question", ({ code }) => {
      const session = getSession(code);
      if (!session) return;
      nextQuestion(session, io);
    });

    socket.on("player:answer", ({ code, questionId, answerIds }) => {
      const session = getSession(code);
      if (!session) return;
      const question = session.quiz.questions[session.currentQuestionIndex];
      if (question?.id !== questionId) return;
      const result = answerQuestion(session, socket.id, answerIds, io);
      if (!result) return;
      socket.emit("player:answer-feedback", result);
      const connectedCount = Array.from(session.players.values()).filter((p) => p.connected !== false).length;
      io.to(code).emit("game:answer-received", {
        answeredCount: session.answeredCount,
        totalPlayers: connectedCount
      });
    });

    socket.on("disconnect", () => {
      for (const session of Array.from(io.sockets.adapter.rooms.keys())) {
        if (session.length === 6) {
          const active = getSession(session);
          if (!active) continue;
          if (active.hostSocketId === socket.id) {
            io.to(active.code).emit("error", { message: "Host disconnected" });
            removeSession(active.code);
            continue;
          }
          if (active.players.has(socket.id)) {
            const player = active.players.get(socket.id);
            active.players.set(socket.id, { ...player, connected: false });
          }
        }
      }
    });
  });
}
