import { useState, useEffect } from 'react';
import { Plus, Bell, Settings } from 'lucide-react';
import SkillCard from '../components/SkillCard';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchSkills = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/skills');
        if (res.ok) {
          const data = await res.json();
          // Transform strict prisma shape to what Frontend expects for match cards:
          // or just pass it as is. 
          const transformed = data.map(skill => ({
            id: skill.id,
            user: { name: skill.user?.name || 'Unknown', avatar: skill.user?.avatar || `https://ui-avatars.com/api/?name=${skill.user?.name || 'User'}` },
            skill: { title: skill.title, description: skill.description, category: skill.category },
            distance: Math.floor(Math.random() * 10) + 1, // mock since we don't have geospatial yet
            rating: 5.0
          }));
          setMatches(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      }
    };
    fetchSkills();
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name || 'Guest'} 👋</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your skill trades.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - My Data */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Card */}
          <div className="card bg-primary-600 text-white border-transparent">
            <h3 className="font-semibold text-primary-100 mb-1">Reputation Score</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold">1,250</span>
              <span className="text-primary-200 text-sm mb-1">pts</span>
            </div>
            <div className="flex gap-4 border-t border-primary-500 pt-4 mt-2">
              <div>
                <div className="text-xl font-bold">12</div>
                <div className="text-xs text-primary-200">Trades</div>
              </div>
              <div>
                <div className="text-xl font-bold">4.9</div>
                <div className="text-xs text-primary-200">Avg Rating</div>
              </div>
            </div>
          </div>

          {/* My Skills */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Skills You Offer</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-800">Full-stack Web Dev (Node/React)</div>
                <div className="text-sm text-slate-500">Expert Level</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-800">Machine Learning Basics</div>
                <div className="text-sm text-slate-500">Intermediate Level</div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Skills You Want</h3>
            <div className="space-y-3">
              <div className="p-3 bg-accent-50 rounded-lg border border-accent-100 text-accent-800 text-sm font-medium">
                UI/UX Design
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-sm font-medium">
                Digital Marketing
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Matches */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Recommended Matches</h2>
            <select className="bg-transparent border-none text-sm font-medium text-slate-500 focus:ring-0 cursor-pointer">
              <option>Nearest to you</option>
              <option>Highest rated</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map(match => (
              <SkillCard key={match.id} {...match} />
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
