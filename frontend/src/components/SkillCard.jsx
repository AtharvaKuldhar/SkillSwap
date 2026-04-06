import { Star, MapPin } from 'lucide-react';

export default function SkillCard({ user, skill, distance, rating, type = 'match' }) {
  return (
    <div className="card hover:shadow-md transition-shadow group flex flex-col h-full relative overflow-hidden">
      {type === 'match' && (
        <div className="absolute top-0 right-0 bg-accent-100 text-accent-700 px-3 py-1 text-xs font-bold rounded-bl-lg">
          98% Match
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
          alt={user.name} 
          className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
        />
        <div>
          <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{skill.title}</h4>
          <p className="text-sm text-slate-500 font-medium">{user.name}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium flex-wrap">
        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {rating?.toFixed(1) || 'NEW'}
        </span>
        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
          <MapPin className="w-3 h-3 text-slate-400" /> {distance} km away
        </span>
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
        {skill.description}
      </p>

      <button className="btn-primary w-full mt-auto">
        Request Trade
      </button>
    </div>
  );
}
