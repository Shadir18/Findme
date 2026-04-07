import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Day-level calendar color coding
const LEVEL_STYLES = {
  available: 'text-gray-600 bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300',
  partial:   'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  full:      'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
  indoorMaintenance: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
};

// ── Hourly Booking Grid Modal ────────────────────────────────────────────────
function CalendarModal({ date, courts, bookings, onClose, setShowAddBooking, setDetailModal, user }) {
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
      <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Courts Registered</h3>
          <p className="text-sm text-gray-500 mb-6">Please add at least one court in the <b>Court Management</b> tab before you can manage its schedule or accept bookings.</p>
          <button onClick={onClose} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition">Understood</button>
        </div>
      </div>
    );
  }

  // Build dynamic hour slots
  const openTime = user?.timing?.open || '06:00';
  const closeTime = user?.timing?.close || '22:00';
  let startH = parseInt(openTime.split(':')[0], 10);
  let endH = parseInt(closeTime.split(':')[0], 10);
  
  if (endH === 0) endH = 24;
  if (endH <= startH) {
    if (endH < 12) endH += 12;
    if (endH <= startH) endH += 12;
  }

  const hours = [];
  for (let h = startH; h < endH; h++) {
    hours.push(`${String(h % 24).padStart(2, '0')}:00`);
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
        const endH   = parseInt(parts[1]);
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
    const endH = (sorted[sorted.length - 1] + 1) % 24;
    const timeSlot = `${String(sorted[0]).padStart(2, '0')}:00 - ${String(endH).padStart(2, '0')}:00`;
    setShowAddBooking({ date, timeSlot, courtName: selectedCourt.name, recurrence });
    onClose();
  };

  // Cell colour classes by state
  const CELL_COLOR = {
    closed:      'bg-red-500 text-white cursor-not-allowed border-red-600',
    maintenance: 'bg-yellow-400 text-yellow-900 cursor-not-allowed border-yellow-500',
    indoorMaintenance: 'bg-purple-500 text-white cursor-not-allowed border-purple-600',
    booked:      'bg-green-500 text-white cursor-pointer border-green-600 hover:bg-green-600 hover:shadow-lg hover:scale-105',
    available:   'bg-white hover:bg-blue-50 text-gray-700 cursor-pointer border-gray-200 hover:border-blue-400',
    selected:    'bg-blue-600 text-white border-blue-700',
  };

  const selectedPreview = (() => {
    if (selectedCells.length === 0) return null;
    const sorted = selectedCells.map(h => parseInt(h)).sort((a, b) => a - b);
    const endH = (sorted[sorted.length - 1] + 1) % 24;
    return `${String(sorted[0]).padStart(2, '0')}:00 – ${String(endH).padStart(2, '0')}:00`;
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

        {/* Recurrence Options */}
        <div className="px-6 py-3 border-b border-gray-100">
          <label className="text-xs text-gray-500 font-semibold block mb-2">Recurrence:</label>
          <select
            value={recurrence}
            onChange={e => setRecurrence(e.target.value)}
            className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Hour Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all shadow-sm ${styleCls}`}
                >
                  <span className="font-bold">{hour}</span>
                  <span className="text-[10px] font-medium leading-none mt-1.5 opacity-90 truncate max-w-[80px]">
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-wrap shrink-0">
          {[
            { bg: 'bg-red-500',    label: 'Closed' },
            { bg: 'bg-yellow-400', label: 'Maintenance' },
            { bg: 'bg-purple-500', label: 'Indoor Maintenance' },
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
export default function AvailabilityCalendar({ bookings = [], courts = [], setShowAddBooking, setDetailModal, user }) {
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

      {selectedDay && createPortal(
        <CalendarModal
          date={selectedDay}
          courts={courts}
          bookings={bookings}
          setShowAddBooking={setShowAddBooking}
          setDetailModal={setDetailModal}
          user={user}
          onClose={() => setSelectedDay(null)}
        />,
        document.body
      )}
    </section>
  );
}
