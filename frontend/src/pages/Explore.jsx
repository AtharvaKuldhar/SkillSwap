import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import SkillCard         from '../components/SkillCard';
import RequestTradeModal from '../components/RequestTradeModal';
import { api } from '../utils/api';

const CATEGORIES = ['All','Technology','Design','Marketing','Business','Language','Music','Arts','Fitness','Cooking','Other'];

export default function Explore() {
  const [skills,    setSkills]    = useState([]);
  const [mySkills,  setMySkills]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [tradeModal, setTradeModal] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const load = async () => {
      setLoading(true);
      try {
        const [skillsData] = await Promise.all([api.get('/api/skills')]);
        setSkills(skillsData);

        if (token) {
          try {
            const profile = await api.get('/api/users/me');
            setMySkills(profile.skillsOffered || []);
          } catch { /* not logged in */ }
        }
      } catch (err) {
        console.error('Explore load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter + search (client-side for speed)
  const filtered = useMemo(() => {
    return skills.filter(s => {
      const inCategory = category === 'All' || s.category === category;
      const q = search.toLowerCase();
      const inSearch = !q || (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.user?.name.toLowerCase().includes(q)
      );
      return inCategory && inSearch;
    });
  }, [skills, category, search]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Explore Skills</h1>
        <p className="text-slate-500">Browse all skills offered by the SkillSwap community.</p>
      </div>

      {/* ── Search + Filter bar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills, people, categories…"
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="input-field pl-9 pr-8 appearance-none cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === c
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2">
          <p className="text-slate-400 mb-2">No skills match your search.</p>
          <button onClick={() => { setSearch(''); setCategory('All'); }} className="text-primary-600 text-sm font-semibold hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">{filtered.length} skill{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(skill => (
              <SkillCard
                key={skill.id}
                skill={{ id: skill.id, title: skill.title, description: skill.description, category: skill.category, proficiencyLevel: skill.proficiencyLevel }}
                user={skill.user}
                rating={null}
                matchScore={null}
                onRequestTrade={isLoggedIn ? () => setTradeModal({ skill, user: skill.user }) : undefined}
              />
            ))}
          </div>
        </>
      )}

      {tradeModal && (
        <RequestTradeModal
          targetSkill={tradeModal.skill}
          targetUser={tradeModal.user}
          mySkills={mySkills}
          onClose={() => setTradeModal(null)}
          onSuccess={() => setTradeModal(null)}
        />
      )}
    </div>
  );
}
