import { useState } from 'react';

export default function HomeView({ onStart }) {
  // Sri Lanka Geographical Data
  const sriLankaData = {
    "Western": {
      "Colombo": ["Colombo 01-15", "Dehiwala", "Mount Lavinia", "Nugegoda", "Battaramulla", "Moratuwa"],
      "Gampaha": ["Gampaha", "Negombo", "Wattala", "Kiribathgoda", "Kadawatha"],
      "Kalutara": ["Kalutara", "Panadura", "Horana", "Beruwala"]
    },
    "Central": {
      "Kandy": ["Kandy City", "Peradeniya", "Katugastota", "Gampola"],
      "Matale": ["Matale", "Dambulla", "Sigiriya"],
      "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele"]
    },
    "Southern": {
      "Galle": ["Galle City", "Hikkaduwa", "Karapitiya", "Ambalangoda"],
      "Matara": ["Matara City", "Weligama", "Akuressa"],
      "Hambantota": ["Hambantota", "Tangalle", "Beliatta"]
    }
    // You can add more provinces (North, East, etc.) following this same pattern
  };

  const [pref, setPref] = useState({
    sport: '',
    level: '',
    province: '',
    district: '',
    town: '',
    selectedSlots: []
  });

  // Time Slot Logic (6 AM - 12 PM)
  const timeSlots = [];
  for (let i = 6; i < 24; i++) {
    timeSlots.push(`${i}:00 - ${i + 1}:00`);
  }

  const toggleSlot = (slot) => {
    setPref(prev => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slot)
        ? prev.selectedSlots.filter(s => s !== slot)
        : [...prev.selectedSlots, slot]
    }));
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 flex flex-col items-center justify-center text-center px-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      
      <h2 className="text-7xl font-black mb-6 leading-tight uppercase tracking-tighter">
        Match. Play. <span className="text-blue-500">Win.</span>
      </h2>

      <div className="w-full max-w-4xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl text-left">
        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-center">Set Your Sri Lankan Squad Preferences</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sport & Level */}
          <div className="space-y-4">
            <select className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50"
              onChange={(e) => setPref({...pref, sport: e.target.value})}>
              <option value="">Select Sport</option>
              <option value="Badminton">Badminton</option>
              <option value="Futsal">Futsal</option>
              <option value="Table Tennis">Table Tennis</option>
              <option value="Basketball">Basketball</option>
            </select>
            
            <select className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50"
              onChange={(e) => setPref({...pref, level: e.target.value})}>
              <option value="">Skill Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Elite">Elite (Club Level)</option>
            </select>
          </div>

          {/* Hierarchical Location Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Province Selector */}
              <select 
                className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-white text-sm outline-none"
                onChange={(e) => setPref({...pref, province: e.target.value, district: '', town: ''})}
              >
                <option value="">Select Province</option>
                {Object.keys(sriLankaData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* District Selector (Depends on Province) */}
              <select 
                disabled={!pref.province}
                className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-white text-sm outline-none disabled:opacity-30"
                onChange={(e) => setPref({...pref, district: e.target.value, town: ''})}
              >
                <option value="">Select District</option>
                {pref.province && Object.keys(sriLankaData[pref.province]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Town Selector (Depends on District) */}
              <select 
                disabled={!pref.district}
                className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-white text-sm outline-none disabled:opacity-30"
                onChange={(e) => setPref({...pref, town: e.target.value})}
              >
                <option value="">Select Nearest Indoor Town</option>
                {pref.district && sriLankaData[pref.province][pref.district].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="mb-10">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-4 block">Select 1-Hour Booking Slots</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${
                  pref.selectedSlots.includes(slot) 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20 scale-95' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onStart(pref)} 
          disabled={!pref.town || pref.selectedSlots.length === 0}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl font-black text-lg transition-all shadow-2xl uppercase tracking-widest"
        >
          Find Your Squad
        </button>
      </div>
    </div>
  );
}