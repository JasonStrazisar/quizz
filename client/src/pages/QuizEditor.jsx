import { useNavigate } from "react-router-dom";

export default function QuizEditor() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen arena-bg flex items-center justify-center px-6 py-10">
      <div className="blob one" />
      <div className="blob two" />
      <div className="sticker w-full max-w-md p-8 text-center relative z-10">
        <span className="ribbon mb-4 inline-flex">Locked</span>
        <h1 className="text-2xl font-display mb-2 text-base-800">Édition désactivée</h1>
        <p className="text-base-800/70 mb-6">Ce quiz est fixe pour le match.</p>
        <button
          onClick={() => navigate("/")}
          className="arena-button bg-arena-cyan px-4 py-2 font-semibold text-base-800"
        >
          Retour au tableau
        </button>
      </div>
    </div>
  );
}
