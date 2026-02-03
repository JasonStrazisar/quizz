import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes, hasToken, login } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const data = await getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (hasToken()) {
      refresh();
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(password);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!hasToken()) {
    return (
      <div className="min-h-screen arena-bg flex items-center justify-center px-6 py-10">
        <div className="blob one" />
        <div className="blob two" />
        <div className="sticker relative z-10 w-full max-w-md p-8 text-center">
          <span className="ribbon mb-4 inline-flex">Accès Coach</span>
          <h1 className="text-4xl font-display mb-2 text-base-800">QuizRush</h1>
          <p className="text-base-800/70 mb-6">Entre dans l'arène pour lancer le match.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full rounded-full bg-white border-base-200 text-base-800 px-4 py-3 text-lg focus:ring-4 focus:ring-arena-cyan/30"
              placeholder="Mot de passe coach"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full arena-button bg-arena-pink px-4 py-3 text-lg font-semibold text-base-800 shadow-glow"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Entrer"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-arena-red">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen arena-bg px-6 py-10">
      <div className="blob one" />
      <div className="blob two" />
      <div className="relative z-10">
        <div className="mb-8 rounded-3xl bg-white/70 border border-base-200 px-6 py-5 shadow-paper">
          <div>
            <span className="ribbon">Prêt pour le match ?</span>
            <h1 className="text-3xl font-display mt-3 text-base-800">
              Comité Régional du Grand-Est de Lutte &amp; DA
            </h1>
            <p className="text-base-800/70">Un seul quiz, un max d'énergie.</p>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-arena-red">{error}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="sticker p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <span className="badge">Match</span>
                  <h2 className="text-2xl font-display mt-3 text-base-800">{quiz.title}</h2>
                  <p className="text-base-800/70 mb-6">{quiz.description || "Prêt pour l'arène."}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/session/${quiz.id}/host`)}
                className="arena-button w-full bg-arena-cyan px-5 py-4 text-lg font-semibold text-base-800"
              >
                Démarrer le match
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
