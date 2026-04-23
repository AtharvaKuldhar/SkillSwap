import { useState } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

export default function RequestTradeModal({ targetSkill, targetUser, mySkills, onClose, onSuccess }) {
  const [offeredSkillId, setOfferedSkillId] = useState('');
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredSkillId) { setError('Please select a skill to offer'); return; }

    setLoading(true);
    setError(null);
    try {
      await api.post('/api/trades', {
        offeredSkillId,
        requestedSkillId: targetSkill.id,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">Propose a Trade</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Trade visualization */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
              <p className="text-xs text-primary-600 font-semibold mb-1">You offer</p>
              <p className="text-sm font-bold text-primary-800 line-clamp-1">
                {offeredSkillId ? mySkills.find(s => s.id === offeredSkillId)?.title || '—' : 'Select below'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div className="flex-1 bg-accent-50 border border-accent-100 rounded-xl p-3 text-center">
              <p className="text-xs text-accent-600 font-semibold mb-1">You receive</p>
              <p className="text-sm font-bold text-accent-800 line-clamp-1">{targetSkill?.title}</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>This trade request costs <strong>1 time credit</strong>.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select your skill to offer
              </label>
              {mySkills.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
                  You haven't added any skills yet. Add skills from your dashboard first.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {mySkills.map(skill => (
                    <label key={skill.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        offeredSkillId === skill.id
                          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'border-slate-800 hover:border-slate-700 hover:bg-white/5'
                      }`}>
                      <input type="radio" name="offeredSkill" value={skill.id}
                        checked={offeredSkillId === skill.id}
                        onChange={() => { setOfferedSkillId(skill.id); setError(null); }}
                        className="text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{skill.title}</p>
                        <p className="text-xs text-slate-400">{skill.proficiencyLevel} · {skill.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-2 animate-fade-in">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={loading || mySkills.length === 0}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
