import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Layout for public pages (/, /login, /signup)
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Minimal public navbar */}
      <header
        className="sticky top-0 z-40 w-full px-6 py-4 flex justify-between items-center"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            S
          </div>
          <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            SkillSwap
          </span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <a href="/login" className="btn-ghost">Sign In</a>
          <a href="/signup" className="btn-primary">Get Started</a>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

// Layout for authenticated pages (uses Navbar + Sidebar)
function AppLayout({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Auth defaultMode="login" /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Auth defaultMode="signup" /></PublicLayout>} />

        {/* Authenticated routes */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/trades" element={<AppLayout><Trades /></AppLayout>} />
        <Route path="/explore" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><Dashboard /></AppLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
