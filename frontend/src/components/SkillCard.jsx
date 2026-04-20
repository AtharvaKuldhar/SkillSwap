import { Star, MapPin, Info } from 'lucide-react';
import { useState } from 'react';

const SCORE_COLOR = (score) => {
  if (score >= 70) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

export default function SkillCard({ skill, user, rating, distance, matchScore, matchReason, onRequestTrade }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="card hover:shadow-md transition-all duration-200 group flex flex-col h-full relative overflow-hidden animate-slide-up">
      {/* Match score badge */}
      {matchScore != null && (
        <div className={`absolute top-0 right-0 flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-bl-xl border ${SCORE_COLOR(matchScore)}`}>
          <span>{matchScore.toFixed(0)}% Match</span>
          {matchReason && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="text-current opacity-60 hover:opacity-100"
                tabIndex={-1}
              >
                <Info className="w-3 h-3" />
              </button>
              {showTip && (
                <div className="absolute right-0 top-5 w-48 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg">
                  <p className="font-semibold mb-0.5">Why this match?</p>
                  <p className="opacity-80">{matchReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* User info */}
      <div className="flex items-start gap-3 mb-3 mt-1">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=16a34a&color=fff`}
          alt={user?.name}
          className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex-shrink-0"
        />
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
            {skill?.title}
          </h4>
          <p className="text-sm text-slate-500 truncate">{user?.name}</p>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
        {rating != null && (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {Number(rating).toFixed(1)}
          </span>
        )}
        {distance != null && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
            <MapPin className="w-3 h-3" /> {distance} km
          </span>
        )}
        {skill?.category && (
          <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md border border-primary-100">
            {skill.category}
          </span>
        )}
        {skill?.proficiencyLevel && (
          <span className="bg-accent-50 text-accent-700 px-2 py-0.5 rounded-md border border-accent-100">
            {skill.proficiencyLevel}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{skill?.description}</p>

      {/* Action button */}
      <button
        onClick={() => onRequestTrade?.({ skill, user })}
        className="btn-primary w-full mt-auto text-sm"
      >
        Request Trade
      </button>
    </div>
  );
}
