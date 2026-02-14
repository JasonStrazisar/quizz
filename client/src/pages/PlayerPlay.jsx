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
  const [wordInput, setWordInput] = useState("");
  const [wordFeedback, setWordFeedback] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const { question, answers, phase, setPhase, setQuestion, setPlayer } = useGameStore();

  useEffect(() => {
    function handleConnect() {
      socket.emit("player:join", { code, nickname });
    }

    function onQuestion(payload) {
      setSelected([]);
      setSubmitted(false);
      setWordFeedback("");
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

    function onWordCloudStart() {
      setPhase("wordcloud");
      setStatus("wordcloud");
      setWordFeedback("");
    }

    function onWordResult(payload) {
      if (!payload.ok) {
        if (payload.reason === "limit_reached") {
          setWordFeedback("Limite atteinte: 5 mots maximum.");
          return;
        }
        if (payload.reason === "profane") {
          setWordFeedback("Mot refusé: contenu inapproprié.");
          return;
        }
        if (payload.reason === "not_wordcloud") {
          setWordFeedback("La partie a commencé.");
          return;
        }
        setWordFeedback("Mot invalide.");
        return;
      }

      setWordInput("");
      setWordFeedback("Mot envoyé anonymement.");
    }

    function onWordCloudUpdate(payload) {
      setWordCount(payload.totalSubmissions || 0);
    }

    socket.on("game:question", onQuestion);
    socket.on("player:answer-feedback", onFeedback);
    socket.on("game:question-results", onResults);
    socket.on("game:final-results", onFinal);
    socket.on("game:wordcloud:start", onWordCloudStart);
    socket.on("player:word-submit-result", onWordResult);
    socket.on("lobby:wordcloud:update", onWordCloudUpdate);
    socket.on("connect", handleConnect);
    if (socket.connected) handleConnect();

    return () => {
      socket.off("game:question", onQuestion);
      socket.off("player:answer-feedback", onFeedback);
      socket.off("game:question-results", onResults);
      socket.off("game:final-results", onFinal);
      socket.off("game:wordcloud:start", onWordCloudStart);
      socket.off("player:word-submit-result", onWordResult);
      socket.off("lobby:wordcloud:update", onWordCloudUpdate);
      socket.off("connect", handleConnect);
    };
  }, [socket, code, nickname, setPhase, setQuestion, setPlayer]);

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

  function submitWord(e) {
    e.preventDefault();
    if (!wordInput.trim()) {
      setWordFeedback("Entre un mot.");
      return;
    }
    socket.emit("player:word-submit", { code, word: wordInput });
  }

  const header = useMemo(() => {
    if (status === "correct") return "Bonne réponse !";
    if (status === "incorrect") return "Oups !";
    if (status === "wordcloud") return "Nuage de mots";
    if (status === "final") return "Résultats finaux";
    return "En attente";
  }, [status]);

  return (
    <div className="min-h-screen arena-bg px-6 py-10">
      <div className="relative z-10">
        <div className="text-center mb-8">
          <span className="badge">Joueur</span>
          <h1 className="text-3xl font-display mt-3 text-white">{header}</h1>
          <p className="text-white/60">{nickname}</p>
        </div>

        {status === "waiting" && (
          <div className="sticker p-8 text-center">
            <p className="text-lg text-white">Le coach prépare la prochaine question...</p>
          </div>
        )}

        {phase === "wordcloud" && (
          <div className="sticker p-8 md:p-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-display text-white">Étape 1 · Nuage anonyme</h2>
              <span className="badge">{wordCount} mots</span>
            </div>
            <p className="mb-6 text-white/60">
              Propose un mot anonyme. Le coach verra le nuage en direct sur son écran.
            </p>
            <form onSubmit={submitWord} className="mx-auto flex max-w-2xl gap-3">
              <input
                className="flex-1 rounded-full bg-white/5 border border-white/10 px-5 py-4 text-lg text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-ffl-red/50 focus:border-ffl-red/50"
                placeholder="Ton mot"
                value={wordInput}
                maxLength={24}
                onChange={(e) => setWordInput(e.target.value)}
              />
              <button className="arena-button bg-ffl-red px-6 py-4 font-bold uppercase tracking-wider text-white">
                Envoyer
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-white/70">{wordFeedback || "5 mots max par joueur."}</p>
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
              className="arena-button w-full bg-ffl-red px-4 py-3 text-lg font-bold text-white tracking-wider uppercase disabled:opacity-50"
              disabled={submitted || selected.length === 0}
            >
              {submitted ? "Verrouillé !" : "Valider"}
            </button>
          </div>
        )}

        {(status === "correct" || status === "incorrect") && (
          <div className="sticker p-8 text-center">
            <p className="text-2xl font-display mb-2 text-white">
              {status === "correct" ? "Bien joué !" : "Bien essayé"}
            </p>
            <p className="text-white/60">Regarde l'écran du coach pour les scores.</p>
          </div>
        )}

        {status === "final" && (
          <div className="sticker p-8 text-center">
            <span className="ribbon">Fin du match</span>
            <p className="text-xl mt-4 text-white">Merci d'avoir joué !</p>
          </div>
        )}
      </div>
    </div>
  );
}
