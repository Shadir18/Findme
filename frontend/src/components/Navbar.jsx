import { Link } from 'react-router-dom';
import { Target, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const userString = sessionStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="bg-[#0A0F1C]/80 backdrop-blur-3xl border-b border-white/10 py-4 px-6 md:px-10 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2.5 group">
        <Target className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        <span className="text-xl font-black text-white tracking-tighter">FIND ME</span>
      </Link>

      <div className="space-x-2 md:space-x-4 font-bold text-sm flex items-center">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5">Home</Link>

        {user ? (
          <div className="flex items-center space-x-3 border-l border-white/10 pl-4 ml-2">
            {user.role === 'player' && (
              <Link
                to="/dashboard"
                className="bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition font-bold text-sm"
              >
                My Dashboard
              </Link>
            )}
            {user.role === 'turf_owner' && (
              <Link
                to="/owner-dashboard"
                className="bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition font-bold text-sm"
              >
                Owner Dashboard
              </Link>
            )}
            <span className="text-white font-bold hidden sm:inline-flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-400" /> {user.name}
            </span>
            <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 border-l border-white/10 pl-4 ml-2">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5">Log In</Link>
            <Link to="/signup" className="bg-white text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.15)]">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}