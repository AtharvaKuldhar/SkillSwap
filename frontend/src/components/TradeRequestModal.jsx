import { useState, useEffect } from 'react';
import { X, Zap, ArrowLeftRight } from 'lucide-react';

export default function TradeRequestModal({ targetSkill, onClose, onSuccess }) {
  const [mySkills, setMySkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchMySkills = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/skills', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Filter to only user's own skills
        const mine = data.filter(s => s.userId === user.id);
        setMySkills(mine);
        if (mine.length > 0) setSelectedSkillId(mine[0].id);
      } catch (err) {
        setError('Could not load your skills.');
      } finally {
        setFetching(false);
      }
    };
    fetchMySkills();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offeredSkillId: selectedSkillId,
          requestedSkillId: targetSkill.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trade request failed');
      onSuccess(data.trade);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: '#1e293b',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Request Trade</h2>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              Propose a skill exchange
            </p>
          </div>
          <button
            id="trade-modal-close"
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credit cost notice */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 text-sm"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
          }}
        >
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>This trade request costs <strong>1 time credit</strong>. You have <strong>{user?.timeCredits ?? 5}</strong> remaining.</span>
        </div>

        {/* Target skill display */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: '#0f172a', border: '1px solid #334155' }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: '#6366f1' }}>YOU WANT TO LEARN</p>
          <p className="font-bold text-white">{targetSkill.title}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{targetSkill.category} · {targetSkill.proficiencyLevel}</p>
          <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>{targetSkill.description}</p>
        </div>

        {/* Exchange icon */}
        <div className="flex justify-center mb-5">
          <div
            className="p-2 rounded-full"
            style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
          >
            <ArrowLeftRight className="w-5 h-5" style={{ color: '#a5b4fc' }} />
          </div>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {fetching ? (
            <div className="text-center py-4" style={{ color: '#64748b' }}>Loading your skills…</div>
          ) : mySkills.length === 0 ? (
            <div
              className="p-3 rounded-xl text-sm text-center mb-4"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              You have no skills listed yet. Add a skill first!
            </div>
          ) : (
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Offer in exchange
              </label>
              <select
                id="trade-offer-select"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="input-field"
                required
              >
                {mySkills.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.proficiencyLevel})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              id="trade-submit-btn"
              type="submit"
              disabled={loading || mySkills.length === 0}
              className="btn-primary flex-1"
              style={{ opacity: (loading || mySkills.length === 0) ? 0.5 : 1 }}
            >
              {loading ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
