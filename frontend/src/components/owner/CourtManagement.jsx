import { Plus, ChevronDown } from 'lucide-react';

function CourtCard({ court, updateCourtStatus, compact }) {
  const currentStatus = court.status || (court.available ? 'Available' : 'Maintenance');
  
  const statusStyles = {
    'Available': 'text-green-700 bg-green-50 border-green-100',
    'Maintenance': 'text-yellow-700 bg-yellow-50 border-yellow-100',
    'Holiday': 'text-red-700 bg-red-50 border-red-100'
  };

  const dotStyles = {
    'Available': 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    'Maintenance': 'bg-yellow-500',
    'Holiday': 'bg-red-500'
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition ${
      currentStatus === 'Available'
        ? 'bg-white border-green-200 hover:border-green-300'
        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
    }`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotStyles[currentStatus] || dotStyles['Maintenance']}`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-semibold text-sm">{court.name}</p>
        {!compact && <p className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider mt-0.5">{court.sport} · {court.capacity} P</p>}
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded hidden sm:block border ${statusStyles[currentStatus] || statusStyles['Maintenance']}`}>
        {currentStatus === 'Holiday' ? 'Holiday Closed' : currentStatus === 'Maintenance' ? 'Maintenance Closed' : 'Available'}
      </span>
      <div className="relative group">
        <select
          value={currentStatus}
          onChange={(e) => updateCourtStatus(court._id, e.target.value)}
          className="appearance-none cursor-pointer bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded px-2.5 py-1.5 pr-8 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
        >
          <option value="Available">Available</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Holiday">Holiday</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
           <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export default function CourtManagement({ courts, updateCourtStatus, toggleCourt, compact }) {
  // Support legacy `toggleCourt` mapping if passed instead of `updateCourtStatus`
  const updateStatus = updateCourtStatus || ((id, status) => toggleCourt(id));

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-gray-800 font-bold text-base">
          {compact ? 'Courts Details' : 'Court Management'}
        </h3>
        {!compact && (
          <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 transition">
            <Plus className="w-3.5 h-3.5" /> New Court
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {courts && courts.length > 0 ? courts.map(court => (
          <CourtCard key={court._id} court={court} updateCourtStatus={updateStatus} compact={compact} />
        )) : (
          <p className="text-gray-400 text-xs text-center py-4">No courts added yet.</p>
        )}
      </div>
      {!compact && (
        <button className="mt-4 w-full py-2 rounded bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 text-xs font-bold uppercase tracking-wider transition">
          Bulk Update Form
        </button>
      )}
    </section>
  );
}
