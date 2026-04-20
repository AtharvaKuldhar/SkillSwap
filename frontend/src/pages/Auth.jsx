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
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState(null);
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
    setError(null);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res  = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      onAuthSuccess?.(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-slate-500">
            {isLogin ? 'Enter your details to sign in' : 'Start trading skills today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field pl-10" placeholder="John Doe" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="input-field pl-10" placeholder="City, Country" required />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field pl-10" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="input-field pl-10" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-4 text-lg">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)} className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
