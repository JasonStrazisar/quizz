import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Join() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [sessionCode, setSessionCode] = useState(code || "");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (code) setSessionCode(code);
  }, [code]);

  function handleJoin(e) {
    e.preventDefault();
    if (!sessionCode || !nickname) return;
    navigate(`/play/${sessionCode}?name=${encodeURIComponent(nickname)}`);
  }

  return (
    <div className="min-h-screen arena-bg flex items-center justify-center px-6 py-10">
      <div className="sticker w-full max-w-md p-8 text-center relative z-10">
        <span className="ribbon mb-4 inline-flex">Entrée Joueur</span>
        <h1 className="text-3xl font-display mb-2 text-white">Rejoins le match</h1>
        <p className="text-white/60 mb-6">Code + pseudo, et c'est parti.</p>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            className="w-full rounded-full bg-white/5 border border-white/10 text-white px-4 py-3 text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ffl-red/50 focus:border-ffl-red/50"
            placeholder="Code de session"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          />
          <input
            className="w-full rounded-full bg-white/5 border border-white/10 text-white px-4 py-3 text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ffl-red/50 focus:border-ffl-red/50"
            placeholder="Ton pseudo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button className="arena-button w-full bg-ffl-red px-4 py-3 text-lg font-bold text-white tracking-wider uppercase">
            C'est parti
          </button>
        </form>
      </div>
    </div>
  );
}
