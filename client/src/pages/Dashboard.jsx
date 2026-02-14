import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes, hasToken, login } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(hasToken());

  async function refresh() {
    try {
      const data = await getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setAuthenticated(hasToken());
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
      setAuthenticated(true);
      await refresh();
    } catch (err) {
      setAuthenticated(hasToken());
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen arena-bg flex items-center justify-center px-6 py-10">
        <div className="sticker relative z-10 w-full max-w-md p-8 text-center">
          <img src="/light_logo.png" alt="France Lutte" className="h-16 mx-auto mb-6" />
          <hr className="ffl-divider mb-6" />
          <span className="ribbon mb-4 inline-flex">Accès Coach</span>
          <p className="text-white/60 text-sm mt-3 mb-6 tracking-wide">
            Connectez-vous pour accéder à l'espace coach.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-4 py-3 text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ffl-red/50 focus:border-ffl-red/50"
              placeholder="Mot de passe coach"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full arena-button bg-ffl-red px-4 py-3 text-lg font-bold text-white tracking-wider uppercase"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Entrer"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-ffl-red">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen arena-bg px-6 py-10">
      <div className="relative z-10">
        <div className="mb-8 rounded-2xl bg-white/5 border border-white/8 px-6 py-6">
          <div className="flex items-center gap-5 mb-4">
            <img src="/light_logo.png" alt="France Lutte" className="h-12" />
            <div className="h-8 w-px bg-white/15" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Fédération Française de Lutte
              </h1>
              <p className="text-white/60 text-sm tracking-wide">Lutte &amp; Disciplines Associées</p>
            </div>
          </div>
          <hr className="ffl-divider mb-4" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="ribbon">Quiz Coach</span>
              <p className="text-white/60 text-sm">Sélectionnez un quiz pour démarrer la session.</p>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-ffl-red">{error}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="sticker p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge">Présentation</span>
                <h2 className="text-2xl font-bold mt-3 text-white">Présentation</h2>
                <p className="text-white/60 mb-6 text-sm">
                  Lancez la présentation complète sans démarrer de session quiz.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/presentation/standalone")}
              className="arena-button w-full bg-ffl-red px-5 py-4 text-lg font-bold text-white uppercase tracking-wider"
            >
              Ouvrir
            </button>
          </div>

          {quizzes.map((quiz) => (
            <div key={quiz.id} className="sticker p-6 md:p-8 group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="badge">Quiz</span>
                  <h2 className="text-2xl font-bold mt-3 text-white">{quiz.title}</h2>
                  <p className="text-white/60 mb-6 text-sm">{quiz.description || "Prêt pour la session."}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/session/${quiz.id}/host`)}
                className="arena-button w-full bg-ffl-red px-5 py-4 text-lg font-bold text-white uppercase tracking-wider"
              >
                Démarrer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
