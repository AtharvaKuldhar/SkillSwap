import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, LayoutDashboard, Compass } from 'lucide-react';
import LandingPage   from './pages/LandingPage';
import Auth          from './pages/Auth';
import Dashboard     from './pages/Dashboard';
import Explore       from './pages/Explore';
import ProtectedRoute from './components/ProtectedRoute';

// ── Inner app (must be inside <Router> to use useNavigate) ───────────────────
function AppContent() {
  const navigate = useNavigate();

  const [authedUser, setAuthedUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (user) => setAuthedUser(user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthedUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-primary-700 transition-colors">S</div>
            <span className="font-bold text-xl tracking-tight text-slate-800">SkillSwap</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-2 text-sm font-medium">
            {authedUser ? (
              <>
                <Link to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/explore"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <Compass className="w-4 h-4" /> Explore
                </Link>
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
                  <img
                    src={authedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authedUser.name)}&background=16a34a&color=fff`}
                    alt={authedUser.name}
                    className="w-8 h-8 rounded-full border-2 border-primary-100"
                  />
                  <span className="text-slate-700 font-medium hidden sm:block">{authedUser.name.split(' ')[0]}</span>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"   className="px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">Sign In</Link>
                <Link to="/signup"  className="btn-primary">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Routes ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col w-full">
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/login"   element={<Auth defaultMode="login"   onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/signup"  element={<Auth defaultMode="signup"  onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard currentUser={authedUser} onUserUpdate={setAuthedUser} />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
