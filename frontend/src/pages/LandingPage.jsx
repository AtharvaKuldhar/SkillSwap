import { ArrowRight, Zap, Globe, Shield, Sparkles, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: Globe,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.2)',
    step: '01',
    title: 'List Your Skills',
    desc: 'Create a profile highlighting your expertise. Tell the world what you can teach and what you want to learn.',
  },
  {
    icon: Zap,
    color: '#d946ef',
    bg: 'rgba(217,70,239,0.12)',
    border: 'rgba(217,70,239,0.2)',
    step: '02',
    title: 'Find Matches',
    desc: 'Browse skill holders in your area. Our smart system surfaces the most relevant swap opportunities for you.',
  },
  {
    icon: Shield,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.2)',
    step: '03',
    title: 'Trade & Grow',
    desc: 'Exchange knowledge directly. Earn reputation points and time credits as you complete each trade.',
  },
];

const STATS = [
  { value: '12K+', label: 'Active Traders', icon: Users },
  { value: '50K+', label: 'Skills Listed', icon: Sparkles },
  { value: '4.9★', label: 'Avg Rating', icon: Star },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] w-full" style={{ background: '#0f172a' }}>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: '#6366f1', filter: 'blur(120px)' }}
        />
        <div
          className="absolute -bottom-20 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: '#d946ef', filter: 'blur(120px)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* ── Hero ── */}
        <section className="w-full max-w-5xl mx-auto px-4 py-24 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#a5b4fc',
            }}
          >
            <Sparkles className="w-4 h-4" />
            The peer-to-peer skills marketplace
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#f8fafc' }}
          >
            Swap Skills,{' '}
            <span className="text-gradient">
              Not Money.
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: '#64748b' }}>
            Connect with talented individuals around you. Trade your expertise for theirs — zero cost, pure value.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              id="landing-get-started-btn"
              className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 rounded-xl"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              id="landing-signin-btn"
              className="btn-secondary text-base px-8 py-3 rounded-xl"
            >
              Sign In
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-lg leading-none">{value}</div>
                  <div className="text-xs" style={{ color: '#475569' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="w-full max-w-5xl mx-auto px-4 pb-24">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6366f1' }}>
              HOW IT WORKS
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              Three steps to your first swap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, bg, border, step, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6 group transition-all duration-200"
                style={{ background: bg, border: `1px solid ${border}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex justify-between items-start mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <span
                    className="text-4xl font-black"
                    style={{ color: 'rgba(255,255,255,0.06)', fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="w-full max-w-5xl mx-auto px-4 pb-24">
          <div
            className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #1e1b4b 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          >
            {/* Decorative blur */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-30"
              style={{ background: '#6366f1', filter: 'blur(60px)' }}
            />
            <div className="relative">
              <h2
                className="text-3xl md:text-4xl font-extrabold text-white mb-4"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                Ready to start swapping?
              </h2>
              <p className="text-lg mb-8" style={{ color: '#a5b4fc' }}>
                Join thousands of learners already trading skills on SkillSwap.
              </p>
              <Link
                to="/signup"
                id="landing-cta-btn"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base transition-all duration-200"
                style={{ background: 'white', color: '#4f46e5' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
