import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Day-level calendar color coding
const LEVEL_STYLES = {
  available: 'text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30',
  partial: 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20',
  full: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
  indoorMaintenance: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
};

// ── Hourly Booking Grid Modal ────────────────────────────────────────────────
function CalendarModal({ date, courts, bookings, onClose, setShowAddBooking, setDetailModal }) {
  // ALL hooks MUST come before any conditional return (React Rules of Hooks)
  const [selectedCourt, setSelectedCourt] = useState(
    courts.length > 0 ? courts[0] : null
  );
  const [selectedCells, setSelectedCells] = useState([]);
  const [recurrence, setRecurrence] = useState('none'); // New state for recurrence

  // Guard after hooks
  if (!date) return null;

  if (courts.length === 0 || !selectedCourt) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1C]/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
        <div className="bg-[#030712] border border-white/10 rounded-3xl w-full max-w-sm p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-[1.5rem] flex items-center justify-center mb-5 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">No Courts Registered</h3>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">Please add at least one court in the <b className="text-white font-black">Court Management</b> tab before you can manage its schedule or accept bookings.</p>
          <button onClick={onClose} className="w-full py-4 bg-white hover:bg-slate-200 text-[#030712] rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all duration-300">Understood</button>
        </div>
      </div>
    );
  }

  // Build hour slots 06:00 → 23:00
  const hours = [];
  for (let h = 6; h <= 23; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  // Non-cancelled bookings for this date + court
  const dayBookings = bookings.filter(
    b => b.date === date && b.court === selectedCourt.name && b.status !== 'Cancelled'
  );

  // Returns { type: 'available'|'booked'|'maintenance'|'closed', label: string }
  const getCellStatus = (hour) => {
    const h = parseInt(hour);

    if (selectedCourt.status === 'Indoor Maintenance') {
      console.log(`Hour ${hour}: Indoor Maintenance`); // Debugging log
      return { type: 'indoorMaintenance', label: 'Indoor Maintenance' };
    }
    if (selectedCourt.status === 'Holiday' || selectedCourt.available === false) {
      console.log(`Hour ${hour}: Closed`); // Debugging log
      return { type: 'closed', label: 'Closed' };
    }

    for (const b of dayBookings) {
      const parts = (b.time || '').split(' - ');
      if (parts.length === 2) {
        const startH = parseInt(parts[0]);
        const endH = parseInt(parts[1]);
        if (h >= startH && h < endH) {
          console.log(`Hour ${hour}: Booked`); // Debugging log
          return { type: 'booked', label: b.team || 'Booked', booking: b };
        }
      }
    }

    console.log(`Hour ${hour}: Available`); // Debugging log
    return { type: 'available', label: 'Open', booking: null };
  };

  const toggleCell = (hour) => {
    const cellStatus = getCellStatus(hour);
    if (cellStatus.type !== 'available') return; // Ensure only available cells can be toggled

    setSelectedCells((prev) => {
      const isSelected = prev.includes(hour);
      const updatedCells = isSelected
        ? prev.filter((h) => h !== hour) // Remove hour if already selected
        : [...prev, hour]; // Add hour if not selected

      console.log('Updated selectedCells:', updatedCells); // Debugging log
      return updatedCells;
    });
  };

  const handleBook = () => {
    if (selectedCells.length === 0) return;
    const sorted = selectedCells.map(h => parseInt(h)).sort((a, b) => a - b);
    const timeSlot = `${String(sorted[0]).padStart(2, '0')}:00 - ${String(sorted[sorted.length - 1] + 1).padStart(2, '0')}:00`;
    setShowAddBooking({ date, timeSlot, courtName: selectedCourt.name, recurrence });
    onClose();
  };

  // Cell colour classes by state
  const CELL_COLOR = {
    closed: 'bg-red-500/10 text-red-500 cursor-not-allowed border-red-500/20 hover:border-red-500/30',
    maintenance: 'bg-amber-500/10 text-amber-500 cursor-not-allowed border-amber-500/20 hover:border-amber-500/30',
    indoorMaintenance: 'bg-purple-500/10 text-purple-400 cursor-not-allowed border-purple-500/20 hover:border-purple-500/30',
    booked: 'bg-emerald-500/10 text-emerald-400 cursor-pointer border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    available: 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer border-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]',
    selected: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
  };

  const selectedPreview = (() => {
    if (selectedCells.length === 0) return null;
    const sorted = selectedCells.map(h => parseInt(h)).sort((a, b) => a - b);
    return `${String(sorted[0]).padStart(2, '0')}:00 – ${String(sorted[sorted.length - 1] + 1).padStart(2, '0')}:00`;
  })();

  return (
    <div
      className="fixed inset-0 bg-[#030712]/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b border-white/10 shrink-0 relative">
          <div className="relative z-10">
            <h3 className="text-white font-black text-xl tracking-tight leading-tight drop-shadow-md">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Court:</span>
              <select
                value={selectedCourt.name}
                onChange={e => {
                  const c = courts.find(x => x.name === e.target.value);
                  if (c) { setSelectedCourt(c); setSelectedCells([]); }
                }}
                className="text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-white cursor-pointer focus:outline-none focus:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 appearance-none"
              >
                {courts.map(c => <option key={c._id} value={c.name} className="bg-[#0A0F1C]">{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2.5 rounded-full transition-all duration-300 relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recurrence Options */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Recurrence:</label>
          <select
            value={recurrence}
            onChange={e => setRecurrence(e.target.value)}
            className="text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-white cursor-pointer focus:outline-none focus:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 appearance-none"
          >
            <option value="none" className="bg-[#0A0F1C]">None</option>
            <option value="daily" className="bg-[#0A0F1C]">Daily</option>
            <option value="weekly" className="bg-[#0A0F1C]">Weekly</option>
            <option value="monthly" className="bg-[#0A0F1C]">Monthly</option>
          </select>
        </div>

        {/* Hour Grid */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[#030712]/30">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {hours.map(hour => {
              const status = getCellStatus(hour);
              const isSelected = selectedCells.includes(hour);
              const activeType = isSelected && status.type === 'available' ? 'selected' : status.type;
              const styleCls = CELL_COLOR[activeType] || CELL_COLOR.available;

              return (
                <button
                  key={hour}
                  disabled={status.type === 'closed' || status.type === 'maintenance' || status.type === 'indoorMaintenance'}
                  onClick={() => {
                    if (status.type === 'booked' && status.booking && setDetailModal) {
                      setDetailModal(status.booking);
                    } else if (status.type === 'available') {
                      toggleCell(hour);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] ${styleCls}`}
                >
                  <span className="font-black text-xs sm:text-sm font-mono tracking-tight text-center">{`${hour} - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`.replace(/(^| - )0/g, '$1')}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest leading-none mt-2 opacity-80 truncate max-w-[90%]">
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flexitems-center justify-center gap-5 px-8 py-4 border-b border-white/5 flex-wrap shrink-0 bg-white/[0.02]">
          {[
            { bg: 'bg-red-500', label: 'Closed' },
            { bg: 'bg-amber-500', label: 'Maintenance' },
            { bg: 'bg-emerald-500', label: 'Booked' },
            { bg: 'bg-white/40', label: 'Available' },
            { bg: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]', label: 'Selected' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.bg}`} />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-5 border-t border-white/10 shrink-0 bg-[#0A0F1C]">
          {selectedPreview && (
            <p className="text-xs text-indigo-400 font-bold mb-4 text-center">
              Booking time: {selectedPreview} ({selectedCells.length} hr{selectedCells.length > 1 ? 's' : ''})
            </p>
          )}
          <button
            disabled={selectedCells.length === 0}
            onClick={handleBook}
            className={`w-full py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${selectedCells.length > 0
                ? 'bg-white hover:bg-slate-200 active:scale-[0.98] text-[#0A0F1C] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            {selectedCells.length > 0
              ? `Book ${selectedCells.length} Hour${selectedCells.length > 1 ? 's' : ''} on ${selectedCourt.name}`
              : 'Tap available slots to select'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Month-level Calendar ─────────────────────────────────────────────────────
export default function AvailabilityCalendar({ bookings = [], courts = [], setShowAddBooking, setDetailModal }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const dateKey = day => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Count active bookings per date from live data
  const bookingsByDate = {};
  bookings.forEach(b => {
    if (b.status === 'Cancelled') return;
    bookingsByDate[b.date] = (bookingsByDate[b.date] || 0) + 1;
  });

  const maxPerDay = courts.length > 0 ? courts.length * 10 : 10;
  const today = new Date();

  return (
    <section className="bg-white/[0.04] backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
      {/* Title + Legend */}
      <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4 flex-wrap gap-4">
        <h2 className="text-white font-black text-lg tracking-tight">Availability Calendar</h2>
        <div className="flex items-center gap-4">
          {[
            { label: 'Available', cls: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
            { label: 'Partial', cls: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
            { label: 'Full', cls: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${l.cls}`} />
              <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-black text-base tracking-widest uppercase">{monthName}</span>
        <button onClick={nextMonth} className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Name Headers */}
      <div className="grid grid-cols-7 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(day);
          const count = bookingsByDate[key] || 0;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          let level = 'available';
          if (count > 0) level = count >= maxPerDay * 0.8 ? 'full' : 'partial';

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(key)}
              title={count > 0 ? `${count} booking${count !== 1 ? 's' : ''}` : 'Click to manage slots'}
              className={`aspect-square rounded-[1rem] text-sm font-black flex items-center justify-center border transition-all duration-300 hover:scale-110 active:scale-95
                ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#030712] shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''}
                ${LEVEL_STYLES[level]}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-5 font-bold">
        Click any day to view &amp; manage hourly time slots
      </p>

      {selectedDay && createPortal(
        <CalendarModal
          date={selectedDay}
          courts={courts}
          bookings={bookings}
          setShowAddBooking={setShowAddBooking}
          setDetailModal={setDetailModal}
          onClose={() => setSelectedDay(null)}
        />,
        document.body
      )}
    </section>
  );
}
