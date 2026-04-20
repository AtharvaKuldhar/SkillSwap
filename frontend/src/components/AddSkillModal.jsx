import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

const CATEGORIES   = ['Technology','Design','Marketing','Business','Language','Music','Arts','Fitness','Cooking','Other'];
const LEVELS       = ['Beginner','Intermediate','Advanced','Expert'];

export default function AddSkillModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title: '', description: '', category: '', proficiencyLevel: '' });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState(null);

  const validate = (name, value) => {
    if (name === 'title') {
      if (!value.trim())          return 'Title is required';
      if (value.trim().length < 3)    return 'Title must be at least 3 characters';
      if (value.trim().length > 100)  return 'Title must be under 100 characters';
    }
    if (name === 'description') {
      if (!value.trim())               return 'Description is required';
      if (value.trim().length < 10)    return 'Description must be at least 10 characters';
      if (value.trim().length > 500)   return 'Description must be under 500 characters';
    }
    if (name === 'category'        && !value) return 'Please select a category';
    if (name === 'proficiencyLevel' && !value) return 'Please select a proficiency level';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setGlobalErr(null);
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = ['title', 'description', 'category', 'proficiencyLevel'];
    const errs = {};
    fields.forEach(f => { errs[f] = validate(f, form[f]); });
    setErrors(errs);
    setTouched(fields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const { skill } = await api.post('/api/skills', form);
      onAdded?.(skill);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(p => ({ ...p, ...err.errors }));
      setGlobalErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasErr = (f) => errors[f] && touched[f];
  const cls = (f) => `input-field ${hasErr(f) ? 'border-red-400 focus:ring-red-400' : ''}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Add a New Skill</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {globalErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{globalErr}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill Title</label>
            <input type="text" name="title" value={form.title}
              onChange={handleChange} onBlur={handleBlur}
              className={cls('title')} placeholder="e.g. React Development" />
            {hasErr('title') && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" value={form.description}
              onChange={handleChange} onBlur={handleBlur} rows={3}
              className={`${cls('description')} resize-none`}
              placeholder="Describe what you can teach (min 10 characters)..." />
            <div className="flex justify-between mt-1">
              {hasErr('description') && <p className="text-red-500 text-xs">{errors.description}</p>}
              <p className="text-xs text-slate-400 ml-auto">{form.description.length}/500</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select name="category" value={form.category}
              onChange={handleChange} onBlur={handleBlur}
              className={cls('category')}>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {hasErr('category') && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proficiency Level</label>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map(l => (
                <button key={l} type="button"
                  onClick={() => { setForm(p => ({ ...p, proficiencyLevel: l })); setTouched(p => ({ ...p, proficiencyLevel: true })); setErrors(p => ({ ...p, proficiencyLevel: null })); }}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.proficiencyLevel === l
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            {hasErr('proficiencyLevel') && <p className="text-red-500 text-xs mt-1">{errors.proficiencyLevel}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
