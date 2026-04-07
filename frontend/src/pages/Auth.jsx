import { useState } from 'react';
import { Mail, Lock, User, MapPin, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth({ defaultMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin
            ? { email: formData.email, password: formData.password }
            : formData
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (label, name, type, placeholder, Icon) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-2.5 h-5 w-5" style={{ color: '#334155' }} />
        <input
          id={`auth-${name}`}
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className="input-field pl-10"
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );

  return (
    <div
      className="flex-1 flex items-center justify-center p-4 relative min-h-[calc(100vh-65px)]"
      style={{ background: '#0f172a' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: '#6366f1', filter: 'blur(100px)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: '#d946ef', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h2
            className="text-3xl font-bold text-white"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            {isLogin ? 'Welcome back' : 'Join SkillSwap'}
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#64748b' }}>
            {isLogin
              ? 'Sign in to continue trading skills'
              : 'Start trading skills with people near you'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}
        >
          {error && (
            <div
              className="mb-5 p-3 rounded-xl text-sm text-center"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {inputRow('Full Name', 'name', 'text', 'John Doe', User)}
                {inputRow('Location', 'location', 'text', 'City, Country', MapPin)}
              </>
            )}
            {inputRow('Email Address', 'email', 'email', 'you@example.com', Mail)}
            {inputRow('Password', 'password', 'password', '••••••••', Lock)}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-base flex items-center justify-center gap-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                  />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: '#64748b' }}>
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  id="auth-toggle-signup"
                  onClick={() => { setIsLogin(false); setError(null); }}
                  className="font-semibold transition-colors"
                  style={{ color: '#818cf8' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  id="auth-toggle-login"
                  onClick={() => { setIsLogin(true); setError(null); }}
                  className="font-semibold transition-colors"
                  style={{ color: '#818cf8' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Credits note for signup */}
        {!isLogin && (
          <div
            className="mt-4 flex items-center gap-2 justify-center text-xs"
            style={{ color: '#475569' }}
          >
            <Zap className="w-3 h-3" style={{ color: '#fbbf24' }} />
            You'll receive 5 time credits to start trading
          </div>
        )}
      </div>
    </div>
  );
}
