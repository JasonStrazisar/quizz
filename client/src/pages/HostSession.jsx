import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useSocket from "../hooks/useSocket";
import useGameStore from "../stores/useGameStore";
import TimerRing from "../components/shared/TimerRing.jsx";
import Leaderboard from "../components/shared/Leaderboard.jsx";

const COLORS = ["bg-arena-pink", "bg-arena-cyan", "bg-arena-violet", "bg-arena-gold"];

export default function HostSession() {
  const { code } = useParams();
  const socket = useSocket(true);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [localCode, setLocalCode] = useState(code);
  const {
    phase,
    question,
    answers,
    leaderboard,
    distribution,
    answeredCount,
    totalPlayers,
    hint,
    explanationPart1,
    explanationPart2,
    correctAnswers,
    setPhase,
    setQuestion,
    setLeaderboard,
    setDistribution,
    setAnswerStats,
    setExplanation
  } = useGameStore();

  const joinUrl = useMemo(() => `${window.location.origin}/join/${localCode}`, [localCode]);

  useEffect(() => {
    function handleConnect() {
      socket.emit("host:create-session", { quizId: code });
    }

    function onCreated(payload) {
      setStatus("ready");
      setPlayers([]);
      setPhase("lobby");
      setLocalCode(payload.code);
      if (payload.code !== code) {
        window.history.replaceState(null, "", `/session/${payload.code}/host`);
      }
    }

    function onPlayerJoined(payload) {
      setPlayers((prev) => [...prev, { nickname: payload.nickname, color: payload.color }]);
      if (payload.playerCount != null) {
        setAnswerStats({ answeredCount, totalPlayers: payload.playerCount });
      }
    }

    function onQuestion(payload) {
      setPhase("question");
      setQuestion({
        question: payload.question,
        answers: payload.answers,
        index: payload.index,
        total: payload.total
      });
      setDistribution([]);
      setAnswerStats({ answeredCount: 0, totalPlayers: players.length });
      setExplanation({ hint: "", part1: "", part2: "", correctAnswers: [] });
    }

    function onResults(payload) {
      setPhase("results");
      setDistribution(payload.distribution);
      setLeaderboard(payload.leaderboard);
    }

    function onFinal(payload) {
      setPhase("final");
      setLeaderboard(payload.leaderboard);
    }

    function onExplanation(payload) {
      setPhase("explanation");
      setExplanation(payload);
    }

    function onAnswerReceived(payload) {
      setAnswerStats({ answeredCount: payload.answeredCount, totalPlayers: payload.totalPlayers });
    }

    socket.on("session:created", onCreated);
    socket.on("session:player-joined", onPlayerJoined);
    socket.on("game:question", onQuestion);
    socket.on("game:question-results", onResults);
    socket.on("game:final-results", onFinal);
    socket.on("game:explanation", onExplanation);
    socket.on("game:answer-received", onAnswerReceived);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("session:created", onCreated);
      socket.off("session:player-joined", onPlayerJoined);
      socket.off("game:question", onQuestion);
      socket.off("game:question-results", onResults);
      socket.off("game:final-results", onFinal);
      socket.off("game:explanation", onExplanation);
      socket.off("game:answer-received", onAnswerReceived);
      socket.off("connect", handleConnect);
    };
  }, [
    socket,
    code,
    players.length,
    answeredCount,
    setPhase,
    setQuestion,
    setLeaderboard,
    setDistribution,
    setAnswerStats,
    setExplanation
  ]);

  function startGame() {
    socket.emit("host:start-game", { code: localCode });
  }

  function nextQuestion() {
    socket.emit("host:next-question", { code: localCode });
  }

  function questionBadgeTitle(text) {
    if (!text) return "Question";
    const parts = text.split("—");
    const title = parts[0]?.trim();
    return title || text;
  }

  async function downloadCsv() {
    const res = await fetch(`/api/sessions/${localCode}/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("quizrush_token") || ""}`
      }
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quizrush-${localCode}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen arena-bg px-6 py-8">
      <div className="blob one" />
      <div className="blob two" />
      <div className="relative z-10">
      {status === "connecting" && <p className="text-base-800">Connexion...</p>}

        {phase === "lobby" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="sticker p-6">
              <h2 className="text-2xl font-display mb-2 text-base-800">Rejoindre la salle</h2>
              <div className="text-4xl font-display tracking-[0.2em] mb-2 text-base-800">{localCode}</div>
              <p className="text-base-800/70">{joinUrl}</p>
              <div className="mt-6">
                <button
                  onClick={startGame}
                  className="arena-button bg-arena-green px-4 py-3 font-semibold text-base-800"
                  disabled={players.length === 0}
                >
                  Lancer le match
                </button>
              </div>
            </div>
            <div className="sticker p-6">
              <h3 className="text-lg font-display mb-4 text-base-800">Participants ({players.length})</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {players.map((player, idx) => (
                    <motion.div
                      key={`${player.nickname}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 200, damping: 16 }}
                      className="flex items-center gap-3 rounded-2xl bg-base-100 px-3 py-2 text-base-800"
                    >
                      <span className={`h-3 w-3 rounded-full ${player.color}`}></span>
                      <span>{player.nickname}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {phase === "question" && question && (
          <div className="relative pb-6">
            <div className="absolute right-0 top-0 flex items-center gap-3">
              <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-base-800 shadow-paper">
                {answeredCount}/{totalPlayers}
              </div>
              <TimerRing duration={question.time_limit} compact />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="badge mb-4">{questionBadgeTitle(question.text)}</span>
              <h2 className="text-4xl font-display text-base-800 md:text-5xl">{question.text}</h2>
              {question.image && (
                <img
                  src={question.image}
                  alt="question"
                  className="mt-6 rounded-2xl max-h-72 w-full max-w-3xl object-cover"
                />
              )}
            </div>
            <div className="answer-grid mt-10">
              {answers.map((answer, idx) => (
                <div
                  key={answer.id || idx}
                  className={`arena-button rounded-3xl px-4 py-6 text-xl font-semibold text-base-800 ${COLORS[idx % COLORS.length]}`}
                >
                  {answer.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "results" && (
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <div className="sticker p-6">
              <h2 className="text-2xl font-display mb-4 text-base-800">Répartition des réponses</h2>
              <div className="space-y-3">
                {distribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-2xl ${COLORS[idx % COLORS.length]}`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-base-800/70">
                        <span>{item.text}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-3 bg-base-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-3 rounded-full bg-arena-violet/60" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={nextQuestion} className="arena-button mt-6 bg-arena-green px-4 py-2 font-semibold text-base-800">
                Question suivante
              </button>
            </div>
            <div className="sticker p-6">
              <h3 className="text-lg font-display mb-4 text-base-800">Classement</h3>
              <Leaderboard items={leaderboard} />
            </div>
          </div>
        )}

        {phase === "explanation" && (
          <div className="sticker p-8 md:p-10 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-base-800/60">
                Réponses correctes
              </div>
              <div className="mt-2 text-xl font-semibold text-base-800">
                {correctAnswers.join(" • ")}
              </div>
              <div className="mt-8 rounded-3xl bg-arena-gold/30 px-6 py-6 text-2xl font-display text-base-800">
                {explanationPart1 || "—"}
              </div>
              <div className="mt-4 rounded-3xl bg-white/80 px-6 py-6 text-xl font-semibold text-base-800 shadow-paper">
                {explanationPart2 || "—"}
              </div>
              <div className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-base-800/60">
                N'oublie jamais{hint ? `: ${hint}` : ""}
              </div>
              <button
                onClick={nextQuestion}
                className="arena-button mt-8 bg-arena-cyan px-5 py-3 text-lg font-semibold text-base-800"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        )}

        {phase === "final" && (
          <div className="sticker p-8">
            <span className="ribbon">Résultats finaux</span>
            <h2 className="text-3xl font-display mt-4 mb-6 text-base-800">Podium</h2>
            <Leaderboard items={leaderboard} />
            <button onClick={downloadCsv} className="arena-button mt-6 bg-arena-violet px-4 py-2 font-semibold text-base-800">
              Télécharger CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
