import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import QuizEditor from "./pages/QuizEditor.jsx";
import HostSession from "./pages/HostSession.jsx";
import Join from "./pages/Join.jsx";
import PlayerPlay from "./pages/PlayerPlay.jsx";
import CoachPresentation from "./pages/CoachPresentation.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/quiz/:id/edit" element={<QuizEditor />} />
      <Route path="/session/:code/host" element={<HostSession />} />
      <Route path="/presentation/standalone" element={<CoachPresentation />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<PlayerPlay />} />
    </Routes>
  );
}
