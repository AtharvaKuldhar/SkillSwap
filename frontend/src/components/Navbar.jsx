import { Bell, LogOut, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header
      id="app-navbar"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
      }}
      className="sticky top-0 z-40 w-full px-6 py-3 flex justify-between items-center"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-lg text-white tracking-tight">
          SkillSwap
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          id="navbar-notifications-btn"
          className="relative p-2 rounded-lg transition-all duration-150"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.8)' }}
          />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: '1px solid #1e293b' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-white leading-none">{user?.name || 'User'}</div>
            <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{user?.location || ''}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="navbar-logout-btn"
          onClick={handleLogout}
          className="p-2 rounded-lg transition-all duration-150"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
