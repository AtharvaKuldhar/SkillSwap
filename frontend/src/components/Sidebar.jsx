import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, ArrowLeftRight, User, Zap, Coins } from 'lucide-react';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/explore',   icon: Compass,         label: 'Explore' },
  { to: '/trades',    icon: ArrowLeftRight,  label: 'My Trades' },
  { to: '/profile',  icon: User,             label: 'Profile' },
];

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        id="app-sidebar"
        className="hidden md:flex flex-col w-60 flex-shrink-0 h-[calc(100vh-57px)] sticky top-[57px]"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderRight: '1px solid rgba(51, 65, 85, 0.5)',
        }}
      >
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              id={`sidebar-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Time Credits */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: '#fbbf24' }} />
              <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Time Credits</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {user?.timeCredits ?? 5}
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>remaining</span>
            </div>
            <div className="mt-2 rounded-full h-1.5 overflow-hidden" style={{ background: '#1e293b' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(((user?.timeCredits ?? 5) / 10) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around py-2 px-4"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(51, 65, 85, 0.5)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
