import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Day-level calendar color coding
const LEVEL_STYLES = {
  available: 'text-gray-600 bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300',
  partial:   'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  full:      'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
};

// ── Hourly Booking Grid Modal ────────────────────────────────────────────────
function CalendarModal({ date, courts, bookings, onClose, setShowAddBooking }) {
  // ALL hooks MUST come before any conditional return (React Rules of Hooks)
  const [selectedCourt, setSelectedCourt] = useState(
    courts.length > 0 ? courts[0] : null
  );
  const [selectedCells, setSelectedCells] = useState([]);

  // Guard after hooks
  if (!date || !selectedCourt) return null;

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

    if (selectedCourt.status === 'Maintenance')
      return { type: 'maintenance', label: 'Maintenance' };
    if (selectedCourt.status === 'Holiday' || selectedCourt.available === false)
      return { type: 'closed', label: 'Closed' };

    for (const b of dayBookings) {
      const parts = (b.time || '').split(' - ');
      if (parts.length === 2) {
        const startH = parseInt(parts[0]);
        const endH   = parseInt(parts[1]);
        if (h >= startH && h < endH) {
          return { type: 'booked', label: b.team || 'Booked' };
        }
      }
    }
    return { type: 'available', label: 'Open' };
  };

  const toggleCell = (hour) => {
    if (getCellStatus(hour).type !== 'available') return;
    setSelectedCells(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]
    );
  };

  const handleBook = () => {
    if (selectedCells.length === 0) return;
    const sorted = selectedCells.map(h => parseInt(h)).sort((a, b) => a - b);
    const timeSlot = `${String(sorted[0]).padStart(2, '0')}:00 - ${String(sorted[sorted.length - 1] + 1).padStart(2, '0')}:00`;
    setShowAddBooking({ date, timeSlot, courtName: selectedCourt.name });
    onClose();
  };

  // Cell colour classes by state
  const CELL_COLOR = {
    closed:      'bg-red-500 text-white cursor-not-allowed border-red-600',
    maintenance: 'bg-yellow-400 text-yellow-900 cursor-not-allowed border-yellow-500',
    booked:      'bg-green-500 text-white cursor-not-allowed border-green-600',
    available:   'bg-white hover:bg-blue-50 text-gray-700 cursor-pointer border-gray-200 hover:border-blue-400',
    selected:    'bg-blue-600 text-white border-blue-700',
  };

  const selectedPreview = (() => {
    if (selectedCells.length === 0) return null;
    const sorted = selectedCells.map(h => parseInt(h)).sort((a, b) => a - b);
    return `${String(sorted[0]).padStart(2, '0')}:00 – ${String(sorted[sorted.length - 1] + 1).padStart(2, '0')}:00`;
  })();

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-gray-900 font-bold text-base leading-tight">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Court:</span>
              <select
                value={selectedCourt.name}
                onChange={e => {
                  const c = courts.find(x => x.name === e.target.value);
                  if (c) { setSelectedCourt(c); setSelectedCells([]); }
                }}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {courts.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-wrap shrink-0">
          {[
            { bg: 'bg-red-500',    label: 'Closed' },
            { bg: 'bg-yellow-400', label: 'Maintenance' },
            { bg: 'bg-green-500',  label: 'Booked' },
            { bg: 'bg-white border border-gray-300', label: 'Available' },
            { bg: 'bg-blue-600',   label: 'Selected' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded shrink-0 ${l.bg}`} />
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Hour Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-2">
            {hours.map(hour => {
              const { type, label } = getCellStatus(hour);
              const isSelected = selectedCells.includes(hour);
              const state = isSelected ? 'selected' : type;

              return (
                <button
                  key={hour}
                  disabled={type !== 'available'}
                  onClick={() => toggleCell(hour)}
                  className={`py-3 px-2 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${CELL_COLOR[state]}`}
                >
                  <span className="text-sm font-extrabold tracking-tight">{hour}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide opacity-90 truncate w-full text-center">
                    {isSelected ? '✓ Selected' : label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0">
          {selectedPreview && (
            <p className="text-xs text-blue-600 font-bold mb-2 text-center">
              Booking time: {selectedPreview} ({selectedCells.length} hr{selectedCells.length > 1 ? 's' : ''})
            </p>
          )}
          <button
            disabled={selectedCells.length === 0}
            onClick={handleBook}
            className={`w-full py-3 rounded-xl font-bold text-sm transition ${
              selectedCells.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
export default function AvailabilityCalendar({ bookings = [], courts = [], setShowAddBooking }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year       = currentDate.getFullYear();
  const month      = currentDate.getMonth();
  const monthName  = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const dateKey   = day => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Count active bookings per date from live data
  const bookingsByDate = {};
  bookings.forEach(b => {
    if (b.status === 'Cancelled') return;
    bookingsByDate[b.date] = (bookingsByDate[b.date] || 0) + 1;
  });

  const maxPerDay = courts.length > 0 ? courts.length * 10 : 10;
  const today = new Date();

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition">
      {/* Title + Legend */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 flex-wrap gap-3">
        <h2 className="text-gray-800 font-bold text-base">Availability Calendar</h2>
        <div className="flex items-center gap-3">
          {[
            { label: 'Available', cls: 'bg-green-500' },
            { label: 'Partial',   cls: 'bg-yellow-400' },
            { label: 'Full',      cls: 'bg-red-400' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.cls}`} />
              <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-white text-gray-600 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-gray-800 font-bold text-sm tracking-wide">{monthName}</span>
        <button onClick={nextMonth} className="p-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-white text-gray-600 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Name Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day   = i + 1;
          const key   = dateKey(day);
          const count = bookingsByDate[key] || 0;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          let level = 'available';
          if (count > 0) level = count >= maxPerDay * 0.8 ? 'full' : 'partial';

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(key)}
              title={count > 0 ? `${count} booking${count !== 1 ? 's' : ''}` : 'Click to manage slots'}
              className={`aspect-square rounded-lg text-xs font-semibold flex items-center justify-center border transition hover:scale-105 active:scale-95
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                ${LEVEL_STYLES[level]}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
        Click any day to view &amp; manage hourly time slots
      </p>

      {selectedDay && (
        <CalendarModal
          date={selectedDay}
          courts={courts}
          bookings={bookings}
          setShowAddBooking={setShowAddBooking}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </section>
  );
}
