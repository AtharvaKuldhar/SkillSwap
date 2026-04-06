import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl leading-none">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">SkillSwap</span>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">Sign In</a>
            <a href="/signup" className="btn-primary">Get Started</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth defaultMode="login" />} />
            <Route path="/signup" element={<Auth defaultMode="signup" />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
