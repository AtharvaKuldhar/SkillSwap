import { useState } from 'react';
import { X, BookOpen, Tag, BarChart2, AlignLeft } from 'lucide-react';

const CATEGORIES = ['Tech', 'Design', 'Language', 'Business', 'Arts', 'Other'];
const PROFICIENCY = ['Beginner', 'Intermediate', 'Expert'];

export default function AddSkillModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    proficiencyLevel: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add skill');
      onSuccess(data.skill);
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
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Add a Skill</h2>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              Share what you can teach others
            </p>
          </div>
          <button
            id="add-skill-modal-close"
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              Skill Title
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#475569' }} />
              <input
                id="add-skill-title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="input-field pl-9"
                placeholder="e.g. React Development"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              Description
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#475569' }} />
              <textarea
                id="add-skill-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input-field pl-9 resize-none"
                placeholder="Briefly describe what you can teach..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Category + Proficiency in row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-4 h-4 z-10" style={{ color: '#475569' }} />
                <select
                  id="add-skill-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="input-field pl-9"
                  required
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Proficiency
              </label>
              <div className="relative">
                <BarChart2 className="absolute left-3 top-2.5 w-4 h-4 z-10" style={{ color: '#475569' }} />
                <select
                  id="add-skill-proficiency"
                  name="proficiencyLevel"
                  value={form.proficiencyLevel}
                  onChange={handleChange}
                  className="input-field pl-9"
                  required
                >
                  <option value="">Select…</option>
                  {PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              id="add-skill-submit"
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Adding…' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
