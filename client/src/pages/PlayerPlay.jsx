import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useSocket from "../hooks/useSocket";
import useGameStore from "../stores/useGameStore";

const COLORS = ["bg-arena-pink", "bg-arena-cyan", "bg-arena-violet", "bg-arena-gold"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PlayerPlay() {
  const { code } = useParams();
  const query = useQuery();
  const nickname = query.get("name") || "Player";
  const socket = useSocket(true);
  const [status, setStatus] = useState("waiting");
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const { question, answers, phase, setPhase, setQuestion, setPlayer } = useGameStore();

  useEffect(() => {
    function handleConnect() {
      socket.emit("player:join", { code, nickname });
    }

    function onQuestion(payload) {
      setSelected([]);
      setSubmitted(false);
      setPhase("question");
      setQuestion(payload);
      setStatus("question");
    }

    function onFeedback(payload) {
      setPhase("feedback");
      setPlayer({ score: payload.score, rank: payload.rank });
      setStatus(payload.correct ? "correct" : "incorrect");
    }

    function onResults() {
      setPhase("waiting");
      setStatus("waiting");
    }

    function onFinal(payload) {
      setPhase("final");
      setPlayer({ score: payload.stats?.score, rank: payload.stats?.rank });
      setStatus("final");
    }

    socket.on("game:question", onQuestion);
    socket.on("player:answer-feedback", onFeedback);
    socket.on("game:question-results", onResults);
    socket.on("game:final-results", onFinal);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("game:question", onQuestion);
      socket.off("player:answer-feedback", onFeedback);
      socket.off("game:question-results", onResults);
      socket.off("game:final-results", onFinal);
      socket.off("connect", handleConnect);
    };
  }, [socket, setPhase, setQuestion, setPlayer]);

  function toggleAnswer(answerId) {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]
    );
  }

  function submitAnswers() {
    if (submitted) return;
    setSubmitted(true);
    socket.emit("player:answer", { code, questionId: question?.id, answerIds: selected });
  }

  const header = useMemo(() => {
    if (status === "correct") return "Bonne réponse !";
    if (status === "incorrect") return "Oups !";
    if (status === "final") return "Résultats finaux";
    return "En attente";
  }, [status]);

  return (
    <div className="min-h-screen arena-bg px-6 py-10">
      <div className="blob one" />
      <div className="blob two" />
      <div className="relative z-10">
        <div className="text-center mb-8">
          <span className="badge">Joueur</span>
          <h1 className="text-3xl font-display mt-3 text-base-800">{header}</h1>
          <p className="text-base-800/70">{nickname}</p>
        </div>

        {status === "waiting" && (
          <div className="sticker p-8 text-center">
            <p className="text-lg text-base-800">Le coach prépare la prochaine question...</p>
          </div>
        )}

        {phase === "question" && question && (
          <div className="space-y-4">
            <div className="answer-grid">
              {answers.map((answer, idx) => (
                <motion.button
                  key={answer.id || idx}
                  whileTap={{ scale: 0.95 }}
                  className={`arena-button relative rounded-3xl px-4 py-8 text-xl font-semibold text-base-800 ${COLORS[idx % COLORS.length]} ${
                    selected.includes(answer.id)
                      ? "ring-4 ring-base-800/70 outline outline-2 outline-base-800/50 shadow-[0_14px_22px_rgba(58,52,42,0.25)] -translate-y-1 border-base-800 bg-white/35"
                      : ""
                  } ${submitted ? "opacity-60" : ""}`}
                  onClick={() => toggleAnswer(answer.id)}
                  disabled={submitted}
                >
                  {selected.includes(answer.id) && (
                    <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-base-800 bg-white text-2xl text-base-800 shadow-[0_8px_14px_rgba(58,52,42,0.2)]">
                      ✓
                    </span>
                  )}
                  {answer.text}
                </motion.button>
              ))}
            </div>
            <button
              onClick={submitAnswers}
              className="arena-button w-full bg-arena-green px-4 py-3 text-lg font-semibold text-base-800 shadow-glow disabled:opacity-50"
              disabled={submitted || selected.length === 0}
            >
              {submitted ? "Verrouillé !" : "Valider"}
            </button>
          </div>
        )}

        {(status === "correct" || status === "incorrect") && (
          <div className="sticker p-8 text-center">
            <p className="text-2xl font-display mb-2 text-base-800">
              {status === "correct" ? "Bien joué !" : "Essaie encore !"}
            </p>
            <p className="text-base-800/70">Regarde l'écran du coach pour les scores.</p>
          </div>
        )}

        {status === "final" && (
          <div className="sticker p-8 text-center">
            <span className="ribbon">Fin du match</span>
            <p className="text-xl mt-4 text-base-800">Merci d'avoir joué !</p>
          </div>
        )}
      </div>
    </div>
  );
}
