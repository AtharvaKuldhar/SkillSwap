import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, TrendingUp, Zap, Target, Star, RefreshCw,
  Loader2, AlertCircle, ChevronRight, Sparkles, BarChart3,
  Users, Lightbulb, ArrowUpRight, Info, CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';

// ── Demo / Mock data (shown when AI is warming up) ────────────────────────────
const DEMO_RECOMMENDATIONS = [
  {
    skill_id: 'demo-1',
    user_id: 'demo-u1',
    user_name: 'Priya Sharma',
    user_avatar: null,
    user_reputation: 120,
    skill_title: 'React & TypeScript',
    skill_description: 'Full-stack React development with TypeScript, hooks, context API, and modern patterns. 3 years of production experience.',
    skill_category: 'Technology',
    proficiency_level: 'Advanced',
    match_score: 87.4,
    match_reason: 'Aligned in javascript, react, and typescript',
    content_score: 91.2,
    collaborative_score: 78.5,
    trust_score: 82.0,
  },
  {
    skill_id: 'demo-2',
    user_id: 'demo-u2',
    user_name: 'Arjun Mehta',
    user_avatar: null,
    user_reputation: 95,
    skill_title: 'UI/UX Design (Figma)',
    skill_description: 'Product design, wireframing, interactive prototypes, and design systems using Figma. Worked on 10+ apps.',
    skill_category: 'Design',
    proficiency_level: 'Expert',
    match_score: 74.1,
    match_reason: 'Shared expertise in design systems',
    content_score: 68.3,
    collaborative_score: 82.1,
    trust_score: 79.5,
  },
  {
    skill_id: 'demo-3',
    user_id: 'demo-u3',
    user_name: 'Sneha Reddy',
    user_avatar: null,
    user_reputation: 210,
    skill_title: 'Python & Machine Learning',
    skill_description: 'Scikit-learn, PyTorch, pandas. Built models for NLP, image classification, and recommendation systems.',
    skill_category: 'Technology',
    proficiency_level: 'Expert',
    match_score: 69.8,
    match_reason: 'Matched on python and machine learning',
    content_score: 72.0,
    collaborative_score: 61.4,
    trust_score: 88.0,
  },
  {
    skill_id: 'demo-4',
    user_id: 'demo-u4',
    user_name: 'Rahul Gupta',
    user_avatar: null,
    user_reputation: 55,
    skill_title: 'Digital Marketing & SEO',
    skill_description: 'Google Ads, SEO audits, content strategy, and analytics. Grew organic traffic by 300% for 5 clients.',
    skill_category: 'Marketing',
    proficiency_level: 'Intermediate',
    match_score: 48.2,
    match_reason: 'Potential exchange opportunity',
    content_score: 34.1,
    collaborative_score: 58.7,
    trust_score: 61.5,
  },
  {
    skill_id: 'demo-5',
    user_id: 'demo-u5',
    user_name: 'Ananya Iyer',
    user_avatar: null,
    user_reputation: 180,
    skill_title: 'Node.js & REST APIs',
    skill_description: 'Backend development with Express, Prisma ORM, JWT auth, and PostgreSQL. Microservices architecture.',
    skill_category: 'Technology',
    proficiency_level: 'Advanced',
    match_score: 65.3,
    match_reason: 'Aligned in node, api, and backend',
    content_score: 70.2,
    collaborative_score: 54.1,
    trust_score: 72.8,
  },
  {
    skill_id: 'demo-6',
    user_id: 'demo-u6',
    user_name: 'Vikram Nair',
    user_avatar: null,
    user_reputation: 140,
    skill_title: 'Spanish Language (C1)',
    skill_description: 'Native-level Spanish speaker offering conversational lessons, business writing, and grammar coaching.',
    skill_category: 'Language',
    proficiency_level: 'Expert',
    match_score: 38.7,
    match_reason: 'Compatible skill profiles',
    content_score: 22.5,
    collaborative_score: 45.3,
    trust_score: 68.0,
  },
];

const DEMO_INSIGHTS = {
  trending_categories: ['Technology', 'Design', 'Marketing', 'Business', 'Language'],
  skill_gap_suggestions: ['Design', 'Marketing', 'Business'],
  your_unique_skills: ['Quantum Computing'],
  demand_areas: ['Technology', 'Design', 'Language'],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const SCORE_BG = (score) => {
  if (score >= 70) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
  if (score >= 40) return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
  return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
};
const SCORE_TEXT = (score) => {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-slate-400';
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatBadge({ label, value, icon: Icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors[color]} text-sm font-semibold`}>
      <Icon className="w-4 h-4" />
      <span>{value}</span>
      <span className="font-normal opacity-70">{label}</span>
    </div>
  );
}

function CategoryPill({ name, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
          : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300'
      }`}
    >
      {name}
    </button>
  );
}

function RecommendationCard({ rec, onRequestTrade, isDemo }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`relative card card-hover overflow-hidden cursor-pointer group transition-all duration-300 ${flipped ? 'ring-2 ring-indigo-500/40' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      {/* Score bar */}
      <div className="absolute top-0 left-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500"
        style={{ width: `${rec.match_score}%` }} />

      {/* Top badges */}
      <div className="flex justify-between items-start mb-3 mt-1">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border bg-gradient-to-r ${SCORE_BG(rec.match_score)} ${SCORE_TEXT(rec.match_score)}`}>
          {rec.match_score.toFixed(0)}% Match
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          {flipped ? 'Click to flip back' : 'Click for AI breakdown'}
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {!flipped ? (
        <>
          {/* User + skill */}
          <div className="flex items-start gap-3 mb-3">
            <img
              src={rec.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.user_name)}&background=4f46e5&color=fff`}
              alt={rec.user_name}
              className="w-10 h-10 rounded-full border-2 border-indigo-500/30 flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                {rec.skill_title}
              </h3>
              <p className="text-xs text-slate-400 truncate">{rec.user_name}</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{rec.skill_description}</p>

          <div className="flex gap-2 flex-wrap text-xs mb-4">
            <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
              {rec.skill_category}
            </span>
            <span className="bg-fuchsia-500/10 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/20">
              {rec.proficiency_level}
            </span>
          </div>

          <div className="text-xs text-indigo-400/70 italic mb-4 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-400" />
            <span>{rec.match_reason}</span>
          </div>
        </>
      ) : (
        /* Score breakdown */
        <div className="py-2 space-y-4">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" /> AI Score Breakdown
          </p>

          {[
            { label: 'Content Match', key: 'content_score', desc: 'TF-IDF skill text similarity', color: 'indigo' },
            { label: 'Behaviour Match', key: 'collaborative_score', desc: "Based on similar users' trades", color: 'fuchsia' },
            { label: 'Trust Score', key: 'trust_score', desc: 'Community reputation (PageRank)', color: 'emerald' },
          ].map(({ label, key, desc, color }) => {
            const val = rec[key] ?? 0;
            const barColors = { indigo: 'bg-indigo-500', fuchsia: 'bg-fuchsia-500', emerald: 'bg-emerald-500' };
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{label}</span>
                  <span className={`font-bold text-${color}-400`}>{val.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${barColors[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(val, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            );
          })}

          <p className="text-[11px] text-slate-500 italic pt-1">
            Final score = 50% content + 30% collaborative + 20% trust
          </p>
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); onRequestTrade(rec); }}
        className="btn-primary w-full text-sm py-2 mt-1"
      >
        {isDemo ? 'See how requests work →' : 'Request Trade'}
      </button>
    </div>
  );
}

function InsightSection({ title, icon: Icon, items, colorClass, emptyText, pillVariant = 'default' }) {
  const pillColors = {
    default: 'bg-slate-800 border-slate-700 text-slate-300',
    gap: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    trending: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    demand: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    unique: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
  };
  const cls = pillColors[pillVariant] || pillColors.default;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <h3 className="font-bold text-white">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── How It Works explainer ─────────────────────────────────────────────────────
function HowItWorks({ collapsed, onToggle }) {
  return (
    <div className="card border-indigo-500/20 bg-indigo-500/5 mb-8">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">How does the AI Recommendation Engine work?</p>
            <p className="text-slate-400 text-xs">Click to {collapsed ? 'expand' : 'collapse'} the explainer</p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>

      {!collapsed && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60">
          {[
            {
              step: '① Content Matching',
              icon: BarChart3,
              color: 'indigo',
              desc: 'TF-IDF vectorises all skill titles, descriptions and categories. Cosine similarity finds skills with text overlap — weighted by your proficiency levels. This is the primary signal (50% weight).',
              tag: 'TF-IDF · Cosine Similarity',
            },
            {
              step: '② Collaborative Filtering',
              icon: Users,
              color: 'fuchsia',
              desc: "Truncated SVD decomposes the trade-history matrix into latent factors. Users with similar trade patterns surface skills you're likely to appreciate — even without direct text overlap (30% weight).",
              tag: 'SVD · Matrix Factorisation',
            },
            {
              step: '③ Trust Scoring',
              icon: Star,
              color: 'amber',
              desc: 'A PageRank graph models community reputation: nodes are users, edges are completed trades weighted by review rating. High-trust users get a proportional boost in your feed (20% weight).',
              tag: 'PageRank · Graph Analysis',
            },
          ].map(({ step, icon: Icon, color, desc, tag }) => (
            <div key={step} className="card bg-slate-900/40 space-y-2">
              <div className={`flex items-center gap-2 text-${color}-400`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-bold text-white">{step}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-500/10 border border-${color}-500/20 text-${color}-300`}>
                {tag}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Demo Mode Banner ───────────────────────────────────────────────────────────
function DemoBanner({ onRetrain, retraining }) {
  return (
    <div className="card border-amber-500/20 bg-amber-500/5 mb-8">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
          <Brain className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-amber-300">AI model is warming up</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            The recommendation model hasn't been trained yet — this happens when the database has very few skills or the service just started.
            The cards below show how the recommendation engine presents results once it's trained.
          </p>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 mb-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-indigo-400" /> To activate live AI:</p>
            <ol className="space-y-1 pl-4 list-decimal">
              <li>Add skills to your profile on the Dashboard</li>
              <li>Sign up with a few test accounts and add different skills</li>
              <li>Make a trade request between accounts</li>
              <li>Click <strong className="text-white">"Train AI Model"</strong> below — live data replaces the demo</li>
            </ol>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onRetrain} disabled={retraining} className="btn-primary text-sm flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Training…' : 'Train AI Model Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live Mode Banner ───────────────────────────────────────────────────────────
function LiveBanner({ aiHealth }) {
  return (
    <div className="card border-emerald-500/20 bg-emerald-500/5 mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-emerald-300 mb-0.5">AI Engine is Live!</h3>
          <p className="text-slate-400 text-sm">
            Model trained on <strong className="text-white">{aiHealth?.skill_count ?? 0} skills</strong> from <strong className="text-white">{aiHealth?.user_count ?? 0} users</strong>.
            Recommendations below are personalised for your profile in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AIInsights() {
  const navigate = useNavigate();

  const [recs, setRecs] = useState([]);
  const [insights, setInsights] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [tradeTarget, setTradeTarget] = useState(null);
  const [mySkills, setMySkills] = useState([]);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [demoTradeShown, setDemoTradeShown] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, profileData] = await Promise.all([
        api.get('/api/ai/health').catch(() => ({ status: 'unavailable', is_fitted: false })),
        api.get('/api/users/me').catch(() => null),
      ]);
      setAiHealth(healthData);
      setMySkills(profileData?.skillsOffered || []);

      if (healthData?.is_fitted) {
        const [recData, insightData] = await Promise.all([
          api.post('/api/ai/recommend', {}).catch(() => ({ recommendations: [] })),
          api.get('/api/ai/insights').catch(() => null),
        ]);
        setRecs(recData?.recommendations || []);
        setInsights(insightData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/api/ai/retrain', {});
      await new Promise(r => setTimeout(r, 2500));
      await fetchAll();
    } catch {
      // silent
    } finally {
      setRetraining(false);
    }
  };

  const isUnavailable = aiHealth?.status === 'unavailable' || !aiHealth?.is_fitted;

  // Use demo data when AI isn't fitted, live data otherwise
  const displayRecs = isUnavailable ? DEMO_RECOMMENDATIONS : recs;
  const displayInsights = isUnavailable ? DEMO_INSIGHTS : insights;
  const isDemo = isUnavailable;

  const categories = ['All', ...new Set(displayRecs.map(r => r.skill_category).filter(Boolean))];
  const filtered = filterCategory === 'All'
    ? displayRecs
    : displayRecs.filter(r => r.skill_category === filterCategory);

  // ── States ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <div className="absolute -right-1 -top-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping" />
        </div>
        <p className="text-slate-400 text-lg font-medium">Consulting the AI engine…</p>
        <p className="text-slate-500 text-sm">Checking model status and loading recommendations</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={fetchAll} className="btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Insights</h1>
            {!isDemo && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-slate-400 max-w-lg">
            Personalized skill recommendations, gap analysis, and market trends — powered by a hybrid AI engine (TF-IDF + SVD + PageRank).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Refresh AI model with latest data"
          >
            <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Training…' : 'Refresh AI'}
          </button>
        </div>
      </div>

      {/* ── AI Health + Stats ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-8">
        <StatBadge
          label="Status"
          value={isDemo ? 'Warming up' : 'Active'}
          icon={isDemo ? Brain : Zap}
          color={isDemo ? 'amber' : 'emerald'}
        />
        {!isDemo ? (
          <>
            <StatBadge label="skills indexed" value={aiHealth?.skill_count ?? 0} icon={BarChart3} color="indigo" />
            <StatBadge label="users analysed" value={aiHealth?.user_count ?? 0} icon={Users} color="fuchsia" />
            <StatBadge label="matches found" value={recs.length} icon={Target} color="emerald" />
          </>
        ) : (
          <>
            <StatBadge label="skills shown" value={DEMO_RECOMMENDATIONS.length} icon={BarChart3} color="indigo" />
            <StatBadge label="AI algorithms" value="3" icon={Users} color="fuchsia" />
            <StatBadge label="score signals" value="TF-IDF · SVD · PageRank" icon={Target} color="emerald" />
          </>
        )}
      </div>

      {/* ── Demo or Live Banner ────────────────────────────────────────────────── */}
      {isDemo ? (
        <DemoBanner onRetrain={handleRetrain} retraining={retraining} />
      ) : (
        <LiveBanner aiHealth={aiHealth} />
      )}

      {/* ── How It Works (always visible, collapsible) ──────────────────────── */}
      <HowItWorks collapsed={explainerOpen} onToggle={() => setExplainerOpen(o => !o)} />

      {/* ── Insights Grid ─────────────────────────────────────────────────────── */}
      {displayInsights && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Skill Intelligence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightSection
              title="In-Demand Categories"
              icon={TrendingUp}
              items={displayInsights.trending_categories || []}
              colorClass="text-indigo-400"
              emptyText="No trending data yet"
              pillVariant="trending"
            />
            <InsightSection
              title="Your Skill Gaps"
              icon={Target}
              items={displayInsights.skill_gap_suggestions || []}
              colorClass="text-amber-400"
              emptyText="You've covered all trending categories!"
              pillVariant="gap"
            />
            <InsightSection
              title="Hot Right Now"
              icon={Zap}
              items={displayInsights.demand_areas || []}
              colorClass="text-emerald-400"
              emptyText="No completed trade data yet"
              pillVariant="demand"
            />
            <InsightSection
              title="Your Unique Skills"
              icon={Star}
              items={displayInsights.your_unique_skills || []}
              colorClass="text-fuchsia-400"
              emptyText="No unique skills found yet"
              pillVariant="unique"
            />
          </div>
        </div>
      )}

      {/* ── Recommendations ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Personalised Matches
              <span className="text-indigo-400">({filtered.length})</span>
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Click any card to see the <strong className="text-indigo-300">AI score breakdown</strong> — content match, collaborative signal, and trust score
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <CategoryPill key={c} name={c} active={filterCategory === c} onClick={() => setFilterCategory(c)} />
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16 border-dashed border-2 border-slate-700">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-slate-400 mb-2">No matches in this category</h3>
            <p className="text-slate-500 text-sm mb-4">Try selecting a different category filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((rec, i) => (
              <RecommendationCard
                key={rec.skill_id + i}
                rec={rec}
                isDemo={false}
                onRequestTrade={r => {
                  if (isDemo) {
                    setDemoTradeShown(true);
                  } else {
                    setTradeTarget(r);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Demo Trade Modal ──────────────────────────────────────────────────── */}
      {demoTradeShown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDemoTradeShown(false)}>
          <div className="card w-full max-w-md border-amber-500/30 bg-amber-500/5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" /> How a Trade Request Works
              </h3>
              <button onClick={() => setDemoTradeShown(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { step: '1', text: 'User clicks "Request Trade" on an AI-recommended skill card', done: true },
                { step: '2', text: 'A modal opens — user selects one of their own skills to offer in exchange', done: true },
                { step: '3', text: 'Trade request sent; receiver gets a real-time Socket.IO notification', done: false },
                { step: '4', text: 'Receiver accepts/rejects from their Dashboard → trade status updates live', done: false },
                { step: '5', text: 'After completion, rating is given → AI retrains with new interaction data', done: false },
              ].map(({ step, text, done }) => (
                <div key={step} className={`flex items-start gap-3 p-3 rounded-xl border ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/40'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{step}</span>
                  <p className={done ? 'text-emerald-300' : 'text-slate-400'}>{text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">In live mode, steps 3–5 happen with real data and real-time updates via WebSocket.</p>
            <button onClick={() => setDemoTradeShown(false)} className="btn-primary w-full mt-4">Got it!</button>
          </div>
        </div>
      )}

      {/* ── Live Trade Modal ──────────────────────────────────────────────────── */}
      {tradeTarget && (
        <TradeModal
          rec={tradeTarget}
          mySkills={mySkills}
          onClose={() => setTradeTarget(null)}
        />
      )}
    </div>
  );
}

// ── Inline Trade Modal ─────────────────────────────────────────────────────────

function TradeModal({ rec, mySkills, onClose }) {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setLoading(true);
    setErr(null);
    try {
      await api.post('/api/trades', {
        receiverId:       rec.user_id,
        offeredSkillId:   selectedSkill,
        requestedSkillId: rec.skill_id,
      });
      setDone(true);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md border-indigo-500/30" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Trade Request Sent!</h3>
            <p className="text-slate-400 text-sm mb-6">
              {rec.user_name} will be notified of your request.
            </p>
            <button onClick={onClose} className="btn-primary">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Request Trade</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">&times;</button>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-indigo-400 font-semibold">AI recommended this match ({rec.match_score.toFixed(0)}% compatibility)</p>
              </div>
              <p className="text-xs text-slate-500 italic">{rec.match_reason}</p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 mb-5">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">You want</p>
              <p className="font-bold text-white">{rec.skill_title}</p>
              <p className="text-sm text-slate-400">from {rec.user_name}</p>
            </div>

            {err && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Offer one of your skills</label>
                {mySkills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">You haven't added any skills yet. Go to Dashboard to add one first.</p>
                ) : (
                  <select
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">Select a skill to offer…</option>
                    {mySkills.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  type="submit"
                  disabled={loading || !selectedSkill || mySkills.length === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Request
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
