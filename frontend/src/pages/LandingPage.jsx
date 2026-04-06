import { ArrowRight, Zap, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center text-center px-4 w-full h-full max-w-5xl mx-auto py-20">
      
      {/* Hero Section */}
      <div className="space-y-6 max-w-3xl mb-24 anim-fade-in-up">
        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm text-primary-600 mb-4 font-semibold shadow-sm">
          <Zap className="h-4 w-4 mr-2" /> The new way to learn
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
          Swap Skills, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Not Money.</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mt-6">
          Connect with talented individuals nearby. Trade your expertise for theirs without spending a dime. (بادل مهاراتك، بدون مال)
        </p>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup" className="btn-primary text-lg px-8 py-3 h-auto w-full sm:w-auto inline-flex items-center justify-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/explore" className="btn-secondary text-lg px-8 py-3 h-auto w-full sm:w-auto inline-flex items-center justify-center">
            Explore Skills
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12 border-t border-slate-200 pt-16">
        <div className="card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-6">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">1. List Your Skills</h3>
          <p className="text-slate-600 leading-relaxed">
            Create a profile highlighting what you can teach and what you want to learn. Our geo-matching does the rest.
          </p>
        </div>
        
        <div className="card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">2. Match Locally</h3>
          <p className="text-slate-600 leading-relaxed">
            Swipe through "Skill-Swappers" within your radius. Find the perfect mutual exchange partner.
          </p>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">3. Trade & Grow</h3>
          <p className="text-slate-600 leading-relaxed">
            Meet up or hop on a video call. Complete the trade and earn reputation points on your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
