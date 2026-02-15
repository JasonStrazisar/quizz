import {
  answerQuestion,
  createSession,
  ensurePlayer,
  getSession,
  getWordCloudPayload,
  hostViewState,
  listActiveSessionByQuiz,
  nextQuestion,
  removeSession,
  scheduleHostCleanup,
  setHost,
  startWordCloud,
  startQuestion,
  submitWord
} from "../services/sessionService.js";

export default function registerSocket(io) {
  io.on("connection", (socket) => {
    socket.on("host:create-session", ({ quizId }) => {
      const byCode = getSession(quizId);
      if (byCode) {
        setHost(byCode, socket.id);
        socket.join(byCode.code);
        socket.emit("session:created", {
          sessionId: byCode.id,
          code: byCode.code,
          reused: true,
          ...hostViewState(byCode)
        });
        socket.emit("lobby:wordcloud:update", getWordCloudPayload(byCode));
        if (byCode.phase === "wordcloud") {
          socket.emit("game:wordcloud:start", getWordCloudPayload(byCode));
        }
        return;
      }
      const existing = listActiveSessionByQuiz(quizId);
      if (existing) {
        setHost(existing, socket.id);
        socket.join(existing.code);
        socket.emit("session:created", {
          sessionId: existing.id,
          code: existing.code,
          reused: true,
          ...hostViewState(existing)
        });
        socket.emit("lobby:wordcloud:update", getWordCloudPayload(existing));
        if (existing.phase === "wordcloud") {
          socket.emit("game:wordcloud:start", getWordCloudPayload(existing));
        }
        return;
      }
      const session = createSession(quizId, socket.id);
      if (!session) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }
      setHost(session, socket.id);
      socket.join(session.code);
      socket.emit("session:created", {
        sessionId: session.id,
        code: session.code,
        reused: false,
        ...hostViewState(session)
      });
      socket.emit("lobby:wordcloud:update", getWordCloudPayload(session));
    });

    socket.on("host:restart-session", ({ identifier }) => {
      const byCode = getSession(identifier);
      const quizId = byCode?.quizId || identifier;
      const existing = listActiveSessionByQuiz(quizId);

      if (existing) {
        io.to(existing.code).emit("error", { message: "Session redémarrée par l'hôte." });
        removeSession(existing.code);
      }

      const session = createSession(quizId, socket.id);
      if (!session) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }

      setHost(session, socket.id);
      socket.join(session.code);
      socket.emit("session:created", {
        sessionId: session.id,
        code: session.code,
        reused: false,
        restarted: true,
        ...hostViewState(session)
      });
      socket.emit("lobby:wordcloud:update", getWordCloudPayload(session));
    });

    socket.on("player:join", ({ code, nickname }) => {
      const session = getSession(code);
      if (!session) {
        socket.emit("error", { message: "Session not available" });
        return;
      }

      const existing = Array.from(session.players.values()).some((p) => p.nickname === nickname);
      if (!["lobby", "wordcloud"].includes(session.phase) && !existing) {
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
      socket.emit("lobby:wordcloud:update", getWordCloudPayload(session));

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

      if (session.phase === "wordcloud") {
        socket.emit("game:wordcloud:start", getWordCloudPayload(session));
      }

      if (session.phase === "results") {
        socket.emit("game:question-results", {
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
      startWordCloud(session, io);
    });

    socket.on("host:continue-to-question", ({ code }) => {
      const session = getSession(code);
      if (!session || session.phase !== "wordcloud") return;
      startQuestion(session, io);
    });

    socket.on("player:word-submit", ({ code, word }) => {
      const session = getSession(code);
      if (!session) {
        socket.emit("player:word-submit-result", { ok: false, reason: "invalid" });
        return;
      }

      const result = submitWord(session, socket.id, word);
      socket.emit("player:word-submit-result", result);
      if (!result.ok) return;

      io.to(code).emit("lobby:wordcloud:update", getWordCloudPayload(session));
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
            scheduleHostCleanup(active, () => {
              io.to(active.code).emit("error", { message: "Session fermée (hôte absent)." });
              removeSession(active.code);
            });
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
