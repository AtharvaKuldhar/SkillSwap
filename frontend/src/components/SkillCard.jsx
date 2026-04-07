import { Star, MapPin, Sparkles } from 'lucide-react';

const CATEGORY_COLORS = {
  Tech:     { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Design:   { bg: 'rgba(217,70,239,0.15)',  text: '#e879f9', border: 'rgba(217,70,239,0.3)' },
  Language: { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  Business: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  Arts:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Other:    { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
};

export default function SkillCard({ user, skill, distance, rating, onRequestTrade }) {
  const colors = CATEGORY_COLORS[skill?.category] || CATEGORY_COLORS.Other;

  return (
    <div
      className="card card-hover flex flex-col h-full relative overflow-hidden group"
      style={{ cursor: 'default' }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' }}
      />

      {/* Category badge */}
      <div className="flex justify-between items-start mb-4">
        <span
          className="badge text-xs"
          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
        >
          {skill?.category}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}
        >
          <Star className="w-3 h-3 fill-current" />
          {rating?.toFixed(1) || 'New'}
        </span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&bold=true`}
          alt={user?.name}
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ border: '2px solid rgba(99,102,241,0.3)' }}
        />
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm truncate leading-tight group-hover:text-indigo-300 transition-colors">
            {skill?.title}
          </h4>
          <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{user?.name}</p>
        </div>
      </div>

      {/* Distance */}
      {distance && (
        <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#475569' }}>
          <MapPin className="w-3 h-3" />
          <span>{distance} km away</span>
        </div>
      )}

      {/* Description */}
      <p className="text-sm flex-1 mb-4 line-clamp-2" style={{ color: '#94a3b8', lineHeight: '1.5' }}>
        {skill?.description}
      </p>

      {/* CTA */}
      <button
        id={`request-trade-${skill?.id || 'card'}`}
        className="btn-primary w-full mt-auto flex items-center justify-center gap-2"
        onClick={() => onRequestTrade && onRequestTrade(skill)}
      >
        <Sparkles className="w-4 h-4" />
        Request Trade
      </button>
    </div>
  );
}
