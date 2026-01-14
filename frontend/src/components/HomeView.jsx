import { useState } from 'react';

export default function HomeView({ onStart, onOwnerPortal }) {
  return (
    <div className="relative min-h-screen pt-24 pb-20 px-6">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h2 className="text-7xl font-black mb-6 italic uppercase tracking-tighter">
          MATCH. BOOK. <span className="text-blue-500">PLAY.</span>
        </h2>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light">
          Sri Lanka's first unified indoor sports ecosystem for players and owners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* LEFT: PLAYER & SQUAD PORTAL */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-2xl font-black mb-4 italic uppercase">Individual Players</h3>
          <p className="text-slate-500 mb-8 text-sm">Find squads, set your availability, and get matched with games nearby.</p>
          <button 
            onClick={() => onStart('player', currentPrefs)}
            className="w-full py-4 bg-transparent border-2 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white rounded-2xl font-black tracking-widest transition-all"
          >
            FIND A GAME
          </button>
        </div>

        {/* RIGHT: INDOOR OWNER PORTAL */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-blue-500/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <span className="bg-blue-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase">For Owners</span>
          </div>
          <h3 className="text-2xl font-black mb-4 italic uppercase">Turf Owners</h3>
          <p className="text-slate-500 mb-8 text-sm">List your indoor facility, update your hourly schedule, and manage bookings.</p>
          <button 
            onClick={() => onStart('owner')}
            className="w-full py-4 bg-transparent border-2 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white rounded-2xl font-black tracking-widest transition-all"
          >
            MANAGE MY TURF
          </button>
        </div>
      </div>
    </div>
    
  );
}