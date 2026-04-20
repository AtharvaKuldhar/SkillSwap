import { useState } from 'react';
import { Mail, Lock, User, MapPin, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Password strength scorer ──────────────────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 12)          s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  if (/[A-Z]/.test(pw))        s++;
  if (s <= 1) return { level: 1, label: 'Weak',   color: 'bg-red-500',    text: 'text-red-500'    };
  if (s <= 2) return { level: 2, label: 'Fair',   color: 'bg-orange-400', text: 'text-orange-400' };
  if (s <= 3) return { level: 3, label: 'Good',   color: 'bg-yellow-400', text: 'text-yellow-500' };
  return             { level: 4, label: 'Strong', color: 'bg-green-500',  text: 'text-green-500'  };
};

// ── Per-field validators ──────────────────────────────────────────────────────
const validators = {
  name: (v) => {
    const t = v.trim();
    if (!t)           return 'Name is required';
    if (t.length < 2) return 'Name must be at least 2 characters';
    if (t.length > 50) return 'Name must be under 50 characters';
    return null;
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return null;
  },
  password: (v) => {
    if (!v)          return 'Password is required';
    if (v.length < 8)    return 'Password must be at least 8 characters';
    if (!/\d/.test(v))   return 'Password must contain at least one number';
    return null;
  },
  confirmPassword: (v, pw) => {
    if (!v)     return 'Please confirm your password';
    if (v !== pw) return 'Passwords do not match';
    return null;
  },
  location: (v) => {
    if (!v.trim()) return 'Location is required';
    if (v.trim().length < 2) return 'Enter a valid location';
    return null;
  },
};

export default function Auth({ defaultMode = 'login', onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '', location: '' });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [globalErr, setGlobalErr] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const navigate = useNavigate();

  const pwStrength = getStrength(form.password);

  // Validate a single field
  const validateField = (name, value) =>
    name === 'confirmPassword'
      ? validators.confirmPassword(value, form.password)
      : validators[name]?.(value) ?? null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setGlobalErr(null);
    if (touched[name]) {
      setErrors(p => ({ ...p, [name]: validateField(name, value) }));
    }
    // Also re-validate confirmPassword when password changes
    if (name === 'password' && touched.confirmPassword) {
      setErrors(p => ({ ...p, confirmPassword: validators.confirmPassword(form.confirmPassword, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validateField(name, value) }));
  };

  // Validate all relevant fields before submission
  const validateAll = () => {
    const fields = isLogin
      ? ['email', 'password']
      : ['name', 'email', 'password', 'confirmPassword', 'location'];

    const errs = {};
    fields.forEach(f => { errs[f] = validateField(f, form[f]); });
    setErrors(errs);
    setTouched(fields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalErr(null);
    if (!validateAll()) return;

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, location: form.location };

    try {
      const res  = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        // Map server-side field errors into inline UI
        if (data.errors) setErrors(p => ({ ...p, ...data.errors }));
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      onAuthSuccess?.(data.user);
      navigate('/dashboard');
    } catch (err) {
      setGlobalErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login) => {
    setIsLogin(login);
    setForm({ name: '', email: '', password: '', confirmPassword: '', location: '' });
    setErrors({});  setTouched({}); setGlobalErr(null);
  };

  // Helpers for rendering
  const hasErr = (f) => errors[f] && touched[f];
  const inputCls = (f) =>
    `input-field pl-10 ${hasErr(f) ? 'border-red-400 focus:ring-red-400' : ''}`;

  const FErr = ({ field }) =>
    hasErr(field) ? <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors[field]}</p> : null;

  return (
    <div className="flex-1 flex justify-center items-center p-4 min-h-[calc(100vh-72px)]">
      <div className="card w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary-200">S</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isLogin ? 'Sign in to your SkillSwap account' : 'Start trading skills for free'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Global error banner */}
          {globalErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 animate-fade-in">
              {globalErr}
            </div>
          )}

          {/* Signup-only fields */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input type="text" name="name" value={form.name}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inputCls('name')} placeholder="John Doe" autoComplete="name" />
                </div>
                <FErr field="name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input type="text" name="location" value={form.location}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inputCls('location')} placeholder="City, Country" autoComplete="address-level2" />
                </div>
                <FErr field="location" />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" name="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                className={inputCls('email')} placeholder="you@example.com" autoComplete="email" />
            </div>
            <FErr field="email" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} onBlur={handleBlur}
                className={`${inputCls('password')} pr-10`} placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'} />
              <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FErr field="password" />

            {/* Password strength meter (signup only) */}
            {!isLogin && form.password && pwStrength && (
              <div className="mt-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= pwStrength.level ? pwStrength.color : 'bg-slate-200'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${pwStrength.text}`}>{pwStrength.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Use 12+ chars, numbers, and symbols for a strong password</p>
              </div>
            )}
          </div>

          {/* Confirm Password (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('confirmPassword')} pr-10`} placeholder="••••••••"
                  autoComplete="new-password" />
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                )}
              </div>
              <FErr field="confirmPassword" />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 mt-2 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? (
            <p>Don't have an account?{' '}
              <button onClick={() => switchMode(false)} className="text-primary-600 hover:text-primary-700 font-semibold">Sign up</button>
            </p>
          ) : (
            <p>Already have an account?{' '}
              <button onClick={() => switchMode(true)} className="text-primary-600 hover:text-primary-700 font-semibold">Sign in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
