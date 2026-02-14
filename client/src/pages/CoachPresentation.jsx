import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FINAL_DECK } from "../lib/presentationDeck.js";

const MASKS = {
  cover: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_1_couv.png",
  chapterRed: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_2_chapitre.png",
  chapterBlue: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_3_chapitre.png",
  content: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_4_page_courante.png",
  photoA: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_5_masque_photo.png",
  photoB: "/presentation/FF_LUTTE_MASQUES_POWERPOINT_6_masque_photo.png"
};

export default function CoachPresentation() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState({});

  const currentSlide = FINAL_DECK[index];
  const isFirstSlide = index === 0;
  const isLastSlide = index === FINAL_DECK.length - 1;
  const currentMask =
    currentSlide?.template === "bulletNavy" || currentSlide?.template === "tableNavy" || currentSlide?.template === "ctaLink"
      ? null
      : MASKS[currentSlide?.template] || MASKS.content;
  const photoMissing = currentSlide ? missingPhotos[currentSlide.id] : false;

  function prevSlide() {
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function nextSlide() {
    setIndex((prev) => Math.min(FINAL_DECK.length - 1, prev + 1));
  }

  useEffect(() => {
    if (done) return undefined;

    function onKeyDown(e) {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done]);

  return (
    <div className="h-[100dvh] w-screen bg-[#04094f]">
      <div className="relative h-full w-full overflow-hidden">
        {!done && (
          <div className="absolute inset-0">
            {currentMask ? (
              <img src={currentMask} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#050852]" />
            )}
          </div>
        )}

        {!done && (
          <>
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
              <span className="badge">{index + 1}/{FINAL_DECK.length}</span>
            </div>
            <div className="absolute right-6 top-6">
              <button
                onClick={() => navigate("/")}
                className="arena-button bg-white/10 border border-white/20 px-5 py-3 font-bold text-white tracking-wider uppercase"
              >
                Fermer
              </button>
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
                    onClick={() => setDone(true)}
                    className="arena-button bg-ffl-red px-5 py-3 font-bold text-white tracking-wider uppercase"
                  >
                    Terminer
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {done && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <span className="ribbon">Terminé</span>
            <h2 className="mt-6 text-4xl font-display text-white">Présentation terminée</h2>
            <p className="mt-3 text-white/70">La session est maintenant clôturée.</p>
            <button
              onClick={() => navigate("/")}
              className="arena-button mt-8 bg-white/10 border border-white/20 px-5 py-3 font-bold text-white tracking-wider uppercase"
            >
              Retour accueil coach
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
