import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useSocket from "../hooks/useSocket";
import useGameStore from "../stores/useGameStore";
import TimerRing from "../components/shared/TimerRing.jsx";
import Leaderboard from "../components/shared/Leaderboard.jsx";
import { FINAL_DECK } from "../lib/presentationDeck.js";

const COLORS = ["bg-arena-pink", "bg-arena-cyan", "bg-arena-violet", "bg-arena-gold"];
const MASKS = {
  cover: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_1_couv.png",
  chapterRed: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_2_chapitre.png",
  chapterBlue: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_3_chapitre.png",
  content: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_4_page_courante.png",
  photoA: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_5_masque_photo.png",
  photoB: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_6_masque_photo.png"
};

export default function HostSession() {
  const { code } = useParams();
  const socket = useSocket(true);
  const [players, setPlayers] = useState([]);
  const [wordCloud, setWordCloud] = useState([]);
  const [wordSubmissions, setWordSubmissions] = useState(0);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [presentationDone, setPresentationDone] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState({});
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
  const joinQrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        joinUrl
      )}`,
    [joinUrl]
  );

  useEffect(() => {
    function handleConnect() {
      socket.emit("host:create-session", { quizId: code });
    }

    function onCreated(payload) {
      setStatus("ready");
      setPlayers([]);
      setWordCloud([]);
      setWordSubmissions(0);
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

    function onWordCloudStart() {
      setPhase("wordcloud");
    }

    function onResults(payload) {
      setPhase("results");
      setDistribution(payload.distribution);
      setLeaderboard(payload.leaderboard);
    }

    function onFinal(payload) {
      setPhase("final");
      setLeaderboard(payload.leaderboard);
      setPresentationIndex(0);
      setPresentationDone(false);
      setMissingPhotos({});
    }

    function onExplanation(payload) {
      setPhase("explanation");
      setExplanation(payload);
    }

    function onAnswerReceived(payload) {
      setAnswerStats({ answeredCount: payload.answeredCount, totalPlayers: payload.totalPlayers });
    }

    function onWordCloudUpdate(payload) {
      setWordCloud(payload.words || []);
      setWordSubmissions(payload.totalSubmissions || 0);
    }

    socket.on("session:created", onCreated);
    socket.on("session:player-joined", onPlayerJoined);
    socket.on("game:question", onQuestion);
    socket.on("game:question-results", onResults);
    socket.on("game:final-results", onFinal);
    socket.on("game:explanation", onExplanation);
    socket.on("game:answer-received", onAnswerReceived);
    socket.on("game:wordcloud:start", onWordCloudStart);
    socket.on("lobby:wordcloud:update", onWordCloudUpdate);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("session:created", onCreated);
      socket.off("session:player-joined", onPlayerJoined);
      socket.off("game:question", onQuestion);
      socket.off("game:question-results", onResults);
      socket.off("game:final-results", onFinal);
      socket.off("game:explanation", onExplanation);
      socket.off("game:answer-received", onAnswerReceived);
      socket.off("game:wordcloud:start", onWordCloudStart);
      socket.off("lobby:wordcloud:update", onWordCloudUpdate);
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

  function continueToQuestion() {
    socket.emit("host:continue-to-question", { code: localCode });
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

  function startPresentation() {
    setPresentationIndex(0);
    setPresentationDone(false);
    setMissingPhotos({});
    setPhase("presentation");
  }

  function prevSlide() {
    setPresentationIndex((prev) => Math.max(0, prev - 1));
  }

  function nextSlide() {
    setPresentationIndex((prev) => Math.min(FINAL_DECK.length - 1, prev + 1));
  }

  function finishPresentation() {
    setPresentationDone(true);
  }

  function returnToPodium() {
    setPresentationDone(false);
    setPhase("final");
  }

  useEffect(() => {
    if (phase !== "presentation" || presentationDone) return undefined;

    function onKeyDown(e) {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, presentationDone]);

  const currentSlide = FINAL_DECK[presentationIndex];
  const isFirstSlide = presentationIndex === 0;
  const isLastSlide = presentationIndex === FINAL_DECK.length - 1;
  const currentMask =
    currentSlide?.template === "bulletNavy" || currentSlide?.template === "tableNavy" || currentSlide?.template === "ctaLink"
      ? null
      : MASKS[currentSlide?.template] || MASKS.content;
  const photoMissing = currentSlide ? missingPhotos[currentSlide.id] : false;

  return (
    <div className="min-h-screen arena-bg px-6 py-8">
      <div className="relative z-10">
        {status === "connecting" && <p className="text-white">Connexion...</p>}

        {phase === "lobby" && (
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="sticker p-6">
              <h2 className="text-2xl font-display mb-2 text-white">Rejoindre la salle</h2>
              <div className="text-4xl font-display tracking-[0.2em] mb-2 text-white">{localCode}</div>
              <p className="text-white/60 break-all">{joinUrl}</p>
              <div className="mt-5 rounded-2xl border border-white/15 bg-white p-3 w-fit">
                <img
                  src={joinQrUrl}
                  alt="QR code pour rejoindre la salle"
                  className="h-40 w-40 md:h-48 md:w-48 object-contain"
                />
              </div>
              <p className="mt-3 text-sm text-white/60">
                Scanne ce QR code pour rejoindre directement la partie.
              </p>
              <div className="mt-6">
                <button
                  onClick={startGame}
                  className="arena-button bg-ffl-red px-4 py-3 font-bold text-white tracking-wider uppercase"
                  disabled={players.length === 0}
                >
                  Lancer le match
                </button>
              </div>
            </div>
            <div className="sticker p-6">
              <h3 className="text-lg font-display mb-4 text-white">Participants ({players.length})</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {players.map((player, idx) => (
                    <motion.div
                      key={`${player.nickname}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 200, damping: 16 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 text-white"
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

        {phase === "wordcloud" && (
          <div className="sticker p-8 md:p-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-3xl font-display text-white">Nuage de mots</h2>
              <span className="badge">{wordSubmissions} entrées</span>
            </div>
            <p className="text-sm text-white/60">
              Étape 1: les joueurs envoient des mots anonymes. Puis clique sur Continuer.
            </p>
            <div className="mt-6 flex min-h-[52vh] flex-wrap content-center items-center justify-center gap-3 rounded-3xl bg-white/5 p-6">
              {wordCloud.length === 0 && <p className="text-lg text-white/50">En attente des premiers mots…</p>}
              {wordCloud.map((item) => (
                <span
                  key={item.text}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white"
                  style={{ fontSize: `${0.8 + item.weight * 0.25}rem` }}
                >
                  {item.text}
                  {item.count > 1 && <span className="ml-1 text-white/65">x{item.count}</span>}
                </span>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={continueToQuestion}
                className="arena-button bg-ffl-red px-8 py-4 text-xl font-bold tracking-wider uppercase text-white"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {phase === "question" && question && (
          <div className="relative pb-6">
            <div className="absolute left-0 top-0">
              <img src="/light_logo.png" alt="France Lutte" className="h-12 w-auto md:h-14 object-contain" />
            </div>
            <div className="absolute right-0 top-0 flex items-center gap-3">
              <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {answeredCount}/{totalPlayers}
              </div>
              <TimerRing duration={question.time_limit} compact />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="badge mb-4">{questionBadgeTitle(question.text)}</span>
              <h2 className="text-4xl font-display text-white md:text-5xl">{question.text}</h2>
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
              <h2 className="text-2xl font-display mb-4 text-white">Répartition des réponses</h2>
              <div className="space-y-3">
                {distribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-2xl ${COLORS[idx % COLORS.length]}`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-white/60">
                        <span>{item.text}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-3 rounded-full bg-ffl-red/60" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={nextQuestion} className="arena-button mt-6 bg-ffl-red px-4 py-2 font-bold text-white tracking-wider uppercase">
                Question suivante
              </button>
            </div>
            <div className="sticker p-6">
              <h3 className="text-lg font-display mb-4 text-white">Classement</h3>
              <Leaderboard items={leaderboard} />
            </div>
          </div>
        )}

        {phase === "explanation" && (
          <div className="sticker p-8 md:p-10 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                Réponses correctes
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                {correctAnswers.join(" • ")}
              </div>
              <div className="mt-8 rounded-3xl bg-ffl-red/15 px-6 py-6 text-2xl font-display text-white">
                {explanationPart1 || "—"}
              </div>
              <div className="mt-4 rounded-3xl bg-white/5 px-6 py-6 text-xl font-semibold text-white">
                {explanationPart2 || "—"}
              </div>
              <div className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
                N'oublie jamais{hint ? `: ${hint}` : ""}
              </div>
              <button
                onClick={nextQuestion}
                className="arena-button mt-8 bg-ffl-red px-5 py-3 text-lg font-bold text-white tracking-wider uppercase"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        )}

        {phase === "final" && (
          <div className="sticker p-8">
            <span className="ribbon">Résultats finaux</span>
            <h2 className="text-3xl font-display mt-4 mb-6 text-white">Podium</h2>
            <Leaderboard items={leaderboard} />
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={downloadCsv} className="arena-button bg-ffl-red px-4 py-2 font-bold text-white tracking-wider uppercase">
                Télécharger CSV
              </button>
              <button onClick={startPresentation} className="arena-button bg-white/10 px-4 py-2 font-bold text-white tracking-wider uppercase border border-white/20">
                Lancer la présentation
              </button>
            </div>
          </div>
        )}

        {phase === "presentation" && (
          <div className="fixed inset-0 z-50 bg-[#04094f]">
            {!presentationDone && (
              <>
                <div className="absolute inset-0">
                  {currentMask ? (
                    <img src={currentMask} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#050852]" />
                  )}
                </div>

                {currentSlide?.template === "cover" && (
                  <div className="absolute inset-0 px-16 py-12">
                    <div className="absolute right-16 top-1/2 w-full max-w-[760px] -translate-y-1/2 text-right">
                      <h2 className="text-6xl font-display leading-[1.06] text-white drop-shadow-[0_3px_0_rgba(4,9,79,0.9)]">
                        {currentSlide.title}
                      </h2>
                      {currentSlide.subtitle && (
                        <p className="mt-6 text-[18px] font-bold uppercase tracking-tight text-white">
                          {currentSlide.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(currentSlide?.template === "chapterRed" || currentSlide?.template === "chapterBlue") && (
                  <div className="absolute inset-0 flex items-end justify-end p-16 text-right">
                    <div className="max-w-3xl">
                      <h2 className="text-5xl font-display leading-tight text-white">{currentSlide.title}</h2>
                      <p className="mt-4 text-7xl font-black leading-none text-[#ee2b37]">{currentSlide.number}</p>
                    </div>
                  </div>
                )}

                {currentSlide?.template === "content" && (
                  <div className="absolute inset-0 px-[16%] py-[14%]">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ee2b37]">{currentSlide.kicker}</p>
                    <h2 className="mt-4 max-w-4xl text-5xl font-display leading-tight text-[#04094f]">{currentSlide.title}</h2>
                    <p className="mt-8 max-w-3xl text-2xl leading-relaxed text-[#04094f]">{currentSlide.body}</p>
                  </div>
                )}

                {currentSlide?.template === "bulletNavy" && (
                  <div className="absolute inset-0 px-[7%] py-[8%] text-white">
                    <div className="flex h-full flex-col justify-center gap-10">
                      {currentSlide.sections?.map((section, idx) => (
                        <div key={idx}>
                          {section.heading && (
                            <h3 className="text-[26px] font-medium normal-case leading-tight text-white">
                              {section.heading}
                            </h3>
                          )}
                          <div className={`${section.heading ? "mt-2" : "mt-0"} space-y-1.5`}>
                            {section.paragraphs?.map((paragraph, paragraphIdx) => (
                              <p key={paragraphIdx} className="text-[18px] leading-snug text-white/95">
                                {paragraph}
                              </p>
                            ))}
                            {section.bullets?.map((bullet, bulletIdx) => (
                              <p key={bulletIdx} className="text-[18px] leading-snug text-white/95">
                                • {bullet}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSlide?.template === "tableNavy" && (
                  <div className="absolute inset-0 bg-[#050852] p-8 md:p-12">
                    <div className="h-full w-full overflow-hidden border border-white/45">
                      <div className="grid h-full grid-cols-2 grid-rows-2">
                        {currentSlide.rows?.map((row, rowIdx) =>
                          row.map((cell, colIdx) => (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              className={`border-white/45 ${colIdx === 0 ? "border-r" : ""} ${rowIdx === 0 ? "border-b" : ""}`}
                            >
                              <div className="h-full">
                                <div className="flex h-[38%] items-center justify-center bg-[#050852] px-6 text-center">
                                  <h3 className="font-body text-[clamp(1.45rem,1.9vw,2.1rem)] font-semibold normal-case leading-tight text-white">
                                    {cell.heading}
                                  </h3>
                                </div>
                                <div className="flex h-[62%] items-center bg-[#ececec] px-7 py-5">
                                  <p className="font-body text-[clamp(0.95rem,1.2vw,1.3rem)] leading-[1.45] normal-case text-[#133f6c]">
                                    {cell.body}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentSlide?.template === "ctaLink" && (
                  <div className="absolute inset-0 bg-[#050852] px-[8%] py-[10%] text-white">
                    <div className="grid h-full gap-10 md:grid-cols-[1.5fr_0.9fr] items-center">
                      <div>
                        <h2 className="text-[42px] font-medium normal-case leading-tight text-white">
                          {currentSlide.title}
                        </h2>
                        <p className="mt-6 text-[22px] leading-relaxed text-white/90">{currentSlide.body}</p>
                        <a
                          href={currentSlide.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-8 inline-block break-all text-[20px] text-[#ee2b37] underline underline-offset-4"
                        >
                          {currentSlide.link}
                        </a>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="rounded-2xl bg-white p-5 shadow-[0_16px_30px_rgba(0,0,0,0.35)]">
                          <img src={currentSlide.qr} alt="QR code vers la page d'alerte" className="h-64 w-64 object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(currentSlide?.template === "photoA" || currentSlide?.template === "photoB") && (
                  <div className="absolute inset-0">
                    {!photoMissing ? (
                      <img
                        src={currentSlide.photo}
                        alt={currentSlide.title}
                        className="h-full w-full object-cover"
                        onError={() =>
                          setMissingPhotos((prev) => ({
                            ...prev,
                            [currentSlide.id]: true
                          }))
                        }
                      />
                    ) : (
                      <div className="h-full w-full bg-[#0a114f]/80 flex items-center justify-center px-8 text-center">
                        <p className="text-2xl font-semibold text-white">
                          Image manquante: {currentSlide?.photo}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-12 py-10">
                      <h2 className="text-4xl font-display text-white">{currentSlide.title}</h2>
                      <p className="mt-3 max-w-3xl text-xl text-white/90">{currentSlide.body}</p>
                    </div>
                  </div>
                )}

                <div className="absolute left-6 top-6 flex items-center gap-3">
                  <span className="ribbon">Présentation</span>
                  <span className="badge">{presentationIndex + 1}/{FINAL_DECK.length}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-6 py-6">
                  <button
                    onClick={prevSlide}
                    disabled={isFirstSlide}
                    className="arena-button bg-white/10 px-5 py-3 font-bold text-white tracking-wider uppercase disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <div className="flex gap-3">
                    {!isLastSlide && (
                      <button
                        onClick={nextSlide}
                        className="arena-button bg-ffl-red px-5 py-3 font-bold text-white tracking-wider uppercase"
                      >
                        Suivant
                      </button>
                    )}
                    {isLastSlide && (
                      <button
                        onClick={finishPresentation}
                        className="arena-button bg-ffl-red px-5 py-3 font-bold text-white tracking-wider uppercase"
                      >
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {presentationDone && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="ribbon">Terminé</span>
                <h2 className="mt-6 text-4xl font-display text-white">Présentation terminée</h2>
                <p className="mt-3 text-white/70">La session est maintenant clôturée.</p>
                <button
                  onClick={returnToPodium}
                  className="arena-button mt-8 bg-white/10 border border-white/20 px-5 py-3 font-bold text-white tracking-wider uppercase"
                >
                  Retour au podium
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
