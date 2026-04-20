import { useState } from 'react';
import { Mail, Lock, User, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Auth({ defaultMode = 'login', onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const path = isLogin ? '/auth/login' : '/auth/signup';
    
    try {
      const data = await api.post(path, isLogin ? { email: formData.email, password: formData.password } : formData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      onAuthSuccess?.(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-lg flex justify-center items-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={() => setIsLogin(false)} className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up
              </button>
            </p>
          ) : (
             <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsLogin(true)} className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in
              </button>
            </p>           
          )}
        </div>
      </div>
    </div>
  );
}
