import { Plus, ChevronDown } from 'lucide-react';

function CourtCard({ court, updateCourtStatus, compact, setEditCourtModal }) {
  const currentStatus = court.status || (court.available ? 'Available' : 'Maintenance');

  const statusStyles = {
    'Available': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'Maintenance': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Holiday': 'text-red-400 bg-red-500/10 border-red-500/30'
  };

  const dotStyles = {
    'Available': 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    'Maintenance': 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    'Holiday': 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${currentStatus === 'Available'
        ? 'bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-white/10'
        : 'bg-[#030712]/50 border-white/5 hover:border-white/10'
      }`}>
      <div className={`w-3 h-3 rounded-full shrink-0 ${dotStyles[currentStatus] || dotStyles['Maintenance']}`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-sm flex items-center gap-2">
          {court.name}
          {(court.pricing || court.price_per_hour) && (
            <span className="text-[10px] text-indigo-300 font-black bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 shadow-sm flex items-center gap-1 uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              {court.pricing ? 'Custom Rates' : `LKR ${court.price_per_hour}/hr`}
            </span>
          )}
        </p>
        {!compact && <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1.5">{court.sport} · {court.capacity} P</p>}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg hidden sm:block border ${statusStyles[currentStatus] || statusStyles['Maintenance']}`}>
        {currentStatus === 'Holiday' ? 'Holiday Closed' : currentStatus === 'Maintenance' ? 'Maintenance Closed' : 'Available'}
      </span>
      <div className="relative group shrink-0">
        <select
          value={currentStatus}
          onChange={(e) => updateCourtStatus(court._id, e.target.value)}
          className="appearance-none cursor-pointer bg-[#0A0F1C] border border-white/10 text-slate-300 text-xs font-bold rounded-lg pl-3 pr-8 py-2 hover:border-indigo-500/50 hover:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
        >
          <option value="Available">Available</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Holiday">Holiday</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 group-hover:text-indigo-400 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {!compact && setEditCourtModal && (
        <button
          onClick={() => setEditCourtModal(court)}
          className="ml-2 text-xs font-black uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm"
        >
          Edit
        </button>
      )}
    </div>
  );
}

export default function CourtManagement({ courts, updateCourtStatus, toggleCourt, compact, setEditCourtModal, setShowAddCourtModal, setShowBulkModal }) {
  // Support legacy `toggleCourt` mapping if passed instead of `updateCourtStatus`
  const updateStatus = updateCourtStatus || ((id, status) => toggleCourt(id));

  return (
    <section className="bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-white/10 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
      <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
        <h3 className="text-white font-black text-lg tracking-tight">
          {compact ? 'Courts Details' : 'Court Management'}
        </h3>
        {!compact && setShowAddCourtModal && (
          <button 
            onClick={() => setShowAddCourtModal(true)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-sm transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> New Court
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {courts && courts.length > 0 ? courts.map(court => (
          <CourtCard key={court._id} court={court} updateCourtStatus={updateStatus} compact={compact} setEditCourtModal={setEditCourtModal} />
        )) : (
          <p className="text-slate-500 text-sm font-medium text-center py-6 italic">No courts added yet.</p>
        )}
      </div>
      {!compact && setShowBulkModal && (
        <button 
          onClick={() => setShowBulkModal(true)}
          className="mt-5 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-lg"
        >
          Bulk Update Status
        </button>
      )}
    </section>
  );
}
