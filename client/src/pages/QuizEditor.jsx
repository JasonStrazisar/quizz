import { useNavigate } from "react-router-dom";

export default function QuizEditor() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen arena-bg flex items-center justify-center px-6 py-10">
      <div className="sticker w-full max-w-md p-8 text-center relative z-10">
        <span className="ribbon mb-4 inline-flex">Locked</span>
        <h1 className="text-2xl font-display mb-2 text-white">Édition désactivée</h1>
        <p className="text-white/60 mb-6">Ce quiz est fixe pour le match.</p>
        <button
          onClick={() => navigate("/")}
          className="arena-button bg-ffl-red px-4 py-2 font-bold text-white tracking-wider uppercase"
        >
          Retour au tableau
        </button>
      </div>
    </div>
  );
}
