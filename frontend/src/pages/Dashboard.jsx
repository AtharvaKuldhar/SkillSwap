import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Clock, Star, ChevronRight } from 'lucide-react';
import SkillCard from '../components/SkillCard';
import AddSkillModal from '../components/AddSkillModal';
import TradeRequestModal from '../components/TradeRequestModal';

const LEVEL_COLORS = {
  Expert:       { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Intermediate: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  Beginner:     { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
};

export default function Dashboard() {
  const [allSkills, setAllSkills]         = useState([]);
  const [mySkills, setMySkills]           = useState([]);
  const [user, setUser]                   = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [tradeTarget, setTradeTarget]     = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/skills');
      if (res.ok) {
        const data = await res.json();
        setAllSkills(data);
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setMySkills(data.filter(s => s.userId === currentUser.id));
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  // Skills from OTHER users for the matches section
  const currentUserId = user?.id;
  const otherSkills = allSkills.filter(s => s.userId !== currentUserId);

  const handleAddSkillSuccess = (newSkill) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (newSkill.userId === currentUser.id) {
      setMySkills(prev => [newSkill, ...prev]);
    }
    setAllSkills(prev => [newSkill, ...prev]);
  };

  const handleTradeSuccess = () => {
    // Refresh user credits
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/skills', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).catch(() => {});
  };

  const lvl = (level) => LEVEL_COLORS[level] || LEVEL_COLORS.Beginner;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div className="anim-fade-in-up">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Here's your skill trading hub.
          </p>
        </div>
        <button
          id="dashboard-add-skill-btn"
          onClick={() => setShowAddModal(true)}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Stats card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #3730a3 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            {/* decorative blob */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
              style={{ background: '#8b5cf6', filter: 'blur(20px)' }}
            />
            <div className="relative">
              <p className="text-xs font-semibold mb-1" style={{ color: '#a5b4fc' }}>REPUTATION SCORE</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{user?.reputationPoints ?? 0}</span>
                <span className="text-sm mb-1" style={{ color: '#7c6ef2' }}>pts</span>
              </div>
              <div className="flex gap-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div className="text-xl font-bold text-white">{mySkills.length}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#a5b4fc' }}>Skills</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{user?.timeCredits ?? 5}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#a5b4fc' }}>Credits</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xl font-bold text-white">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    4.9
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#a5b4fc' }}>Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Skills */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Skills You Offer
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
              >
                {mySkills.length}
              </span>
            </div>

            {mySkills.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm mb-3" style={{ color: '#64748b' }}>No skills listed yet.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add your first skill
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mySkills.map(skill => {
                  const c = lvl(skill.proficiencyLevel);
                  return (
                    <div
                      key={skill.id}
                      className="flex justify-between items-center p-3 rounded-xl"
                      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white truncate">{skill.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{skill.category}</div>
                      </div>
                      <span
                        className="badge ml-2 flex-shrink-0"
                        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        {skill.proficiencyLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <h3 className="font-bold text-white mb-3" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              Quick Actions
            </h3>
            <div className="space-y-1">
              {[
                { icon: TrendingUp, label: 'View My Trades', href: '/trades' },
                { icon: Clock, label: 'Trade History', href: '/trades' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center justify-between p-3 rounded-xl transition-all group"
                  style={{ background: '#0f172a', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: '#6366f1' }} />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: '#334155' }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column – Matches ── */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              Explore Skills
            </h2>
            <span className="text-xs" style={{ color: '#475569' }}>
              {otherSkills.length} available
            </span>
          </div>

          {otherSkills.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <p className="text-lg font-semibold text-white mb-2">No skills to explore yet</p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Be the first to add a skill — your skills will appear here for others to discover.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {otherSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  user={{
                    name: skill.user?.name || 'Unknown',
                    avatar: skill.user?.avatar,
                  }}
                  skill={{
                    id: skill.id,
                    title: skill.title,
                    description: skill.description,
                    category: skill.category,
                    proficiencyLevel: skill.proficiencyLevel,
                  }}
                  distance={Math.floor(Math.random() * 15) + 1}
                  rating={skill.user?.reputationPoints > 0 ? 4.5 : null}
                  onRequestTrade={() => setTradeTarget(skill)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSkillModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSkillSuccess}
        />
      )}
      {tradeTarget && (
        <TradeRequestModal
          targetSkill={tradeTarget}
          onClose={() => setTradeTarget(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}
