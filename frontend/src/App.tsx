import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Lesson from './pages/Lesson';
import Quiz from './pages/Quiz';
import AdminCurriculum from './pages/AdminCurriculum';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lesson/:day" element={<Lesson />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/admin" element={<AdminCurriculum />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
