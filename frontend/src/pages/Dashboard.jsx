import { useState, useEffect, useCallback } from 'react';
import { Plus, Bell, Star, Coins, Trash2, Check, X as XIcon, Loader2, Brain, TrendingUp } from 'lucide-react';
import SkillCard from '../components/SkillCard';
import AddSkillModal     from '../components/AddSkillModal';
import RequestTradeModal from '../components/RequestTradeModal';
import { api } from '../utils/api';

const STATUS_COLORS = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED:  'bg-blue-50  text-blue-700  border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED:  'bg-red-50   text-red-700   border-red-200',
};

export default function Dashboard({ currentUser }) {
  const [profile,      setProfile]      = useState(null);
  const [recommendations, setRecs]      = useState([]);
  const [allSkills,    setAllSkills]    = useState([]);
  const [trades,       setTrades]       = useState({ sent: [], received: [] });
  const [insights,     setInsights]     = useState(null);
  const [aiAvailable,  setAiAvailable]  = useState(false);

  const [addSkillOpen,   setAddSkillOpen]   = useState(false);
  const [tradeModal,     setTradeModal]     = useState(null);  // { skill, user }
  const [activeTab,      setActiveTab]      = useState('ai'); // 'ai' | 'all'

  const [loading,    setLoading]    = useState(true);
  const [actionLoading, setAction]  = useState(null); // tradeId being updated

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, tradesData, skillsData] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/trades'),
        api.get('/api/skills'),
      ]);
      setProfile(profileData);
      setTrades(tradesData);
      setAllSkills(skillsData.filter(s => s.userId !== profileData.id));

      // AI recommendations (fail silently)
      try {
        const recData = await api.post('/api/ai/recommend', {});
        if (recData.recommendations?.length > 0) {
          setRecs(recData.recommendations);
          setAiAvailable(true);
        }
      } catch { /* AI is optional */ }

      // AI insights (fail silently)
      try {
        const ins = await api.get('/api/ai/insights');
        setInsights(ins);
      } catch { /* optional */ }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Trade actions ───────────────────────────────────────────────────────────
  const updateTradeStatus = async (tradeId, status) => {
    setAction(tradeId);
    try {
      await api.patch(`/api/trades/${tradeId}/status`, { status });
      await fetchData(); // refresh
    } catch (err) {
      alert(err.message);
    } finally {
      setAction(null);
    }
  };

  // ── Delete skill ────────────────────────────────────────────────────────────
  const deleteSkill = async (skillId) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await api.delete(`/api/skills/${skillId}`);
      setProfile(p => p ? { ...p, skillsOffered: p.skillsOffered.filter(s => s.id !== skillId) } : p);
    } catch (err) {
      alert(err.message);
    }
  };

  // Display user from profile or localStorage fallback
  const user = profile || currentUser;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const receivedPending = trades.received.filter(t => t.status === 'PENDING');
  const mySkills = profile?.skillsOffered || [];

  // Build display cards from AI recs or all skills
  const displayCards = activeTab === 'ai' && aiAvailable
    ? recommendations.map(r => ({
        id:          r.skill_id,
        skill:       { id: r.skill_id, title: r.skill_title, description: r.skill_description, category: r.skill_category, proficiencyLevel: r.proficiency_level },
        user:        { id: r.user_id, name: r.user_name, avatar: r.user_avatar, reputationPoints: r.user_reputation },
        matchScore:  r.match_score,
        matchReason: r.match_reason,
        rating:      null,
      }))
    : allSkills.map(s => ({
        id:    s.id,
        skill: { id: s.id, title: s.title, description: s.description, category: s.category, proficiencyLevel: s.proficiencyLevel },
        user:  s.user,
        matchScore:  null,
        matchReason: null,
        rating: null,
      }));

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your skill trades.</p>
        </div>
        <div className="flex gap-3">
          <button className="relative p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5" />
            {receivedPending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {receivedPending.length}
              </span>
            )}
          </button>
          <button onClick={() => setAddSkillOpen(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats card */}
          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-transparent shadow-lg shadow-primary-200">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=15803d&color=fff`}
                alt={user?.name}
                className="w-12 h-12 rounded-full border-2 border-primary-400"
              />
              <div>
                <div className="font-bold text-lg">{user?.name}</div>
                <div className="text-primary-200 text-sm">{user?.location}</div>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-extrabold">{profile?.reputationPoints ?? user?.reputationPoints ?? 0}</span>
              <span className="text-primary-200 text-sm mb-1">rep pts</span>
            </div>
            <div className="flex gap-4 border-t border-primary-500 pt-4">
              <div>
                <div className="text-2xl font-bold">{profile?.stats?.totalTrades ?? 0}</div>
                <div className="text-xs text-primary-200">Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.stats?.avgRating ?? '—'}</div>
                <div className="text-xs text-primary-200">Avg Rating</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-primary-200" />
                <div>
                  <div className="text-2xl font-bold">{profile?.timeCredits ?? user?.timeCredits ?? 0}</div>
                  <div className="text-xs text-primary-200">Credits</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights panel */}
          {insights && (insights.trending_categories?.length > 0 || insights.skill_gap_suggestions?.length > 0) && (
            <div className="card border-accent-200 bg-accent-50">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-accent-600" />
                <h3 className="font-bold text-accent-800 text-sm">AI Insights</h3>
              </div>
              {insights.skill_gap_suggestions?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-accent-700 mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> In-demand skills you could learn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.skill_gap_suggestions.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-white border border-accent-200 text-accent-700 rounded-full text-xs font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {insights.demand_areas?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-accent-700 mb-1.5">Most traded right now</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.demand_areas.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Skills */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Skills You Offer ({mySkills.length})</h3>
            {mySkills.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-3">No skills listed yet.</p>
                <button onClick={() => setAddSkillOpen(true)} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 inline mr-1" /> Add Your First Skill
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mySkills.map(skill => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-primary-200 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{skill.title}</p>
                      <p className="text-xs text-slate-500">{skill.proficiencyLevel} · {skill.category}</p>
                    </div>
                    <button onClick={() => deleteSkill(skill.id)}
                      className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Trade Requests */}
          {receivedPending.length > 0 && (
            <div className="card border-amber-200 bg-amber-50">
              <h3 className="font-bold text-base mb-3 text-amber-800">
                Trade Requests ({receivedPending.length})
              </h3>
              <div className="space-y-3">
                {receivedPending.map(trade => (
                  <div key={trade.id} className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={trade.requester?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(trade.requester?.name || 'U')}&background=random`}
                        className="w-8 h-8 rounded-full border border-slate-200"
                        alt={trade.requester?.name}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{trade.requester?.name}</p>
                        <p className="text-xs text-slate-500">offers: <span className="font-medium">{trade.offeredSkill?.title}</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">wants: <span className="font-medium text-slate-700">{trade.requestedSkill?.title}</span></p>
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoading === trade.id}
                        onClick={() => updateTradeStatus(trade.id, 'ACCEPTED')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                        {actionLoading === trade.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Accept
                      </button>
                      <button
                        disabled={actionLoading === trade.id}
                        onClick={() => updateTradeStatus(trade.id, 'REJECTED')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                        <XIcon className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Trades */}
          {trades.sent.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-base mb-3 text-slate-800">Sent Trades</h3>
              <div className="space-y-2">
                {trades.sent.slice(0, 5).map(trade => (
                  <div key={trade.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{trade.requestedSkill?.title}</p>
                      <p className="text-xs text-slate-400">→ {trade.receiver?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[trade.status]}`}>
                        {trade.status}
                      </span>
                      {trade.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateTradeStatus(trade.id, 'COMPLETED')}
                          disabled={actionLoading === trade.id}
                          className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60">
                          {actionLoading === trade.id ? '...' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column — Skill Feed ─────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'ai'
                    ? 'bg-white shadow-sm text-primary-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Brain className="w-3.5 h-3.5" />
                AI Picks {aiAvailable && <span className="text-xs bg-primary-100 text-primary-600 rounded-full px-1.5 py-0.5 font-bold ml-0.5">{recommendations.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white shadow-sm text-slate-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                All Skills
              </button>
            </div>
            <p className="text-sm text-slate-400">{displayCards.length} result{displayCards.length !== 1 ? 's' : ''}</p>
          </div>

          {!aiAvailable && activeTab === 'ai' ? (
            <div className="card text-center py-12 border-dashed border-2">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-600 mb-1">AI Engine is warming up</h3>
              <p className="text-slate-400 text-sm">Add skills to your profile, then the AI will compute personalized matches for you.</p>
              <button onClick={() => setActiveTab('all')} className="btn-secondary mt-4 text-sm">Browse All Skills</button>
            </div>
          ) : displayCards.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-2">
              <p className="text-slate-400">No skills to show yet. Be the first to add one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayCards.map(card => (
                <SkillCard
                  key={card.id}
                  skill={card.skill}
                  user={card.user}
                  rating={card.rating}
                  matchScore={card.matchScore}
                  matchReason={card.matchReason}
                  onRequestTrade={() => setTradeModal({ skill: card.skill, user: card.user })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {addSkillOpen && (
        <AddSkillModal
          onClose={() => setAddSkillOpen(false)}
          onAdded={(skill) => {
            setProfile(p => p ? { ...p, skillsOffered: [...(p.skillsOffered || []), skill] } : p);
          }}
        />
      )}

      {tradeModal && (
        <RequestTradeModal
          targetSkill={tradeModal.skill}
          targetUser={tradeModal.user}
          mySkills={mySkills}
          onClose={() => setTradeModal(null)}
          onSuccess={() => { fetchData(); setTradeModal(null); }}
        />
      )}
    </div>
  );
}
