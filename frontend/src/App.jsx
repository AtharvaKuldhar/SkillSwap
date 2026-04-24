import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, LayoutDashboard, Compass, Brain } from 'lucide-react';
import LandingPage   from './pages/LandingPage';
import Auth          from './pages/Auth';
import Dashboard     from './pages/Dashboard';
import Explore       from './pages/Explore';
import AIInsights    from './pages/AIInsights';
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
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans text-slate-100">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.4)] group-hover:bg-indigo-500 transition-all">S</div>
            <span className="font-bold text-xl tracking-tight text-white">SkillSwap</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-2 text-sm font-medium">
            {authedUser ? (
              <>
                <Link to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/explore"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Compass className="w-4 h-4" /> Explore
                </Link>
                <Link to="/ai-insights"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-indigo-300 hover:text-white transition-colors relative"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Brain className="w-4 h-4 text-indigo-400" />
                  AI Insights
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                </Link>
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                  <img
                    src={authedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authedUser.name)}&background=4f46e5&color=fff`}
                    alt={authedUser.name}
                    className="w-8 h-8 rounded-full border-2 border-indigo-500/30"
                  />
                  <span className="text-slate-300 font-medium hidden sm:block">{authedUser.name.split(' ')[0]}</span>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"   className="px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">Sign In</Link>
                <Link to="/signup"  className="btn-primary">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Spacing for fixed header */}
      <div className="h-16" />

      {/* ── Routes ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col w-full">
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/login"   element={<Auth defaultMode="login"   onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/signup"  element={<Auth defaultMode="signup"  onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/ai-insights" element={
            <ProtectedRoute>
              <AIInsights />
            </ProtectedRoute>
          } />
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
