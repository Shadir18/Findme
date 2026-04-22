import { useState } from 'react';

export default function BookingsSchedule({
  courts = [],
  bookings = [],
  selectedDate,
  setSelectedDate,
  setShowAddBooking,
  setDetailModal = () => { },  // safe fallback
  standalone,
  user
}) {
  const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate;

  // --- DYNAMIC HOURS LOGIC ---
  const openTime = user?.timing?.open || '06:00';
  const closeTime = user?.timing?.close || '22:00';

  let startHour = parseInt(openTime.split(':')[0], 10);
  let endHour = parseInt(closeTime.split(':')[0], 10);

  if (endHour === 0) endHour = 24;
  if (endHour <= startHour) {
    if (endHour < 12) endHour += 12;
    if (endHour <= startHour) endHour += 12;
  }

  const hours = [];
  for (let i = startHour; i < endHour; i++) {
    hours.push(i % 24);
  }

  const adjustDate = (days) => {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const getDisplayDate = () => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    if (dateStr === todayStr) return "Today";
    const d = new Date(todayStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return "Tomorrow";
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // --- TIME PARSING HELPERS ---
  const parseToMinutes = (t) => {
    if (!t) return 0;
    const s = t.trim().toUpperCase();
    const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (m12) {
      let h = parseInt(m12[1], 10);
      const mi = parseInt(m12[2], 10);
      const ap = m12[3];
      if (ap === "AM" && h === 12) h = 0;
      if (ap === "PM" && h !== 12) h += 12;
      return h * 60 + mi;
    }
    const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
    return 0;
  };

  const isSlotOccupied = (booking, courtName, hour) => {
    if (booking.date !== dateStr) return false;
    if (booking.court !== courtName) return false;
    if (booking.status === 'Cancelled') return false;

    const bTime = booking.time || booking.timeSlot || "";
    if (!bTime.includes('-')) return false;

    const [startS, endS] = bTime.split('-').map(x => x.trim());
    if (!startS || !endS) return false;

    const bStart = parseToMinutes(startS);
    const bEnd = parseToMinutes(endS);
    const slotStart = hour * 60;
    const slotEnd = (hour + 1) * 60;

    return bStart < slotEnd && slotStart < bEnd;
  };

  return (
    <div className={`bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] ring-1 ring-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.15)] overflow-hidden flex flex-col transition-all duration-300 ${standalone ? 'min-h-[70vh]' : ''}`}>

      {/* Schedule Header */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 z-10 relative">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter shadow-sm">Master Schedule</h2>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">
            Operating Hours: <span className="text-indigo-400">{openTime} to {closeTime}</span>
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center bg-[#0A0F1C] rounded-[1rem] p-1 border border-white/10 shadow-inner">
          <button onClick={() => adjustDate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="w-32 text-center font-black text-sm text-indigo-400 uppercase tracking-widest">
            {getDisplayDate()}
          </div>
          <button onClick={() => adjustDate(1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Interactive Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#030712]/50">
        <div className="min-w-[800px]">

          {/* Grid Header (Courts) */}
          <div className="flex border-b border-white/10 sticky top-0 bg-[#0B1120] z-20 shadow-sm">
            <div className="w-24 shrink-0 border-r border-white/10 p-3 bg-white/5 backdrop-blur-md"></div>
            {courts.length === 0 ? (
              <div className="flex-1 p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/5">No courts registered</div>
            ) : (
              courts.map(court => (
                <div key={court._id || court.name} className="flex-1 p-3 text-center border-r border-white/10 min-w-[200px] bg-white/5 backdrop-blur-md">
                  <h3 className="font-black text-white uppercase tracking-tighter text-sm truncate">{court.name}</h3>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 uppercase tracking-widest mt-1 inline-block">{court.sport}</span>
                </div>
              ))
            )}
          </div>

          <div className="relative">
            {hours.map(hour => {
              const startH = hour;
              const endH = (hour + 1) % 24;
              const timeString = `${startH.toString().padStart(2, '0')}:00`;
              const endTimeString = `${endH.toString().padStart(2, '0')}:00`;
              const displayHour = startH > 12 ? `${startH - 12} PM` : startH === 12 ? '12 PM' : startH === 0 ? '12 AM' : `${startH} AM`;
              const fullSlotString = `${timeString} - ${endTimeString}`;

              return (
                <div key={hour} className="flex border-b border-white/5 group">
                  {/* Time Label */}
                  <div className="w-24 shrink-0 border-r border-white/5 p-3 flex flex-col justify-start items-end bg-white/5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{displayHour}</span>
                  </div>

                  {/* Court Columns */}
                  {courts.map(court => {
                    const slotBooking = bookings.find(b => isSlotOccupied(b, court.name, hour));

                    return (
                      <div key={`${court.name}-${hour}`} className="flex-1 min-w-[200px] border-r border-white/5 relative p-1.5 transition-colors duration-300">
                        {slotBooking ? (
                          (() => {
                            const isOnline = slotBooking.type === 'player_online';
                            const isMaintenance = slotBooking.type === 'maintenance';
                            
                            return (
                              <button
                                onClick={() => setDetailModal(slotBooking)}
                                className={`h-full w-full rounded-xl p-3 border-l-4 flex flex-col justify-center relative overflow-hidden group/card cursor-pointer transition-all duration-300 text-left hover:scale-[1.02] ${
                                    isOnline
                                    ? 'bg-[#0A0F1C]/90 border-emerald-500 hover:bg-[#0A0F1C] shadow-[0_4px_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                                    : isMaintenance
                                    ? 'bg-amber-500/10 border-amber-500 hover:bg-amber-500/20 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                                    : 'bg-white/5 border-amber-400 hover:bg-white/10 ring-1 ring-white/10'
                                  }`}
                              >
                                <span className="absolute top-3 right-3 flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : isMaintenance ? 'bg-amber-400' : 'bg-amber-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : isMaintenance ? 'bg-amber-500' : 'bg-amber-500'}`}></span>
                                </span>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 truncate ${isOnline ? 'text-emerald-400' : isMaintenance ? 'text-amber-500' : 'text-amber-400'}`}>
                                  {isOnline ? '✅ PAID · ONLINE' : isMaintenance ? '🛠️ MAINTENANCE' : (slotBooking.status || 'Booked')}
                                </p>
                                <p className="text-sm text-white font-black truncate leading-tight tracking-wide">
                                  {slotBooking.customerName || slotBooking.team || 'Player'}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-2 opacity-80 group-hover/card:opacity-100 transition-opacity">
                                  <p className="text-[10px] font-black text-slate-300 truncate tracking-wider">
                                    {isMaintenance ? 'Offline' : `LKR ${(slotBooking.amount || 0).toLocaleString()}`}
                                  </p>
                                  {isOnline && (
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-black tracking-widest uppercase shadow-sm">
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })()
                        ) : (
                          <button
                            onClick={() => setShowAddBooking({
                              courtName: court.name,
                              timeSlot: fullSlotString,
                              date: dateStr
                            })}
                            className="h-full min-h-[80px] w-full rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:shadow-inner"
                          >
                            <span className="text-xl mb-1 font-light">+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Lock {displayHour} Slot</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}