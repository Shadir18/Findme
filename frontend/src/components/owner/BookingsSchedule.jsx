import { useState } from 'react';

export default function BookingsSchedule({ 
  courts = [], 
  bookings = [], 
  selectedDate, 
  setSelectedDate, 
  setShowAddBooking,
  setDetailModal = () => {},  // safe fallback — backend field: booking object
  standalone,
  user // We pass the logged-in owner here to read their specific opening hours
}) {
  const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate;

  // --- DYNAMIC HOURS LOGIC ---
  // Read the owner's specific times from the database, or default to 06:00 - 22:00
  const openTime = user?.timing?.open || '06:00';
  const closeTime = user?.timing?.close || '22:00';
  
  let startHour = parseInt(openTime.split(':')[0], 10);
  let endHour = parseInt(closeTime.split(':')[0], 10);
  
  if (endHour === 0) endHour = 24;
  if (endHour <= startHour) {
    if (endHour < 12) endHour += 12;
    if (endHour <= startHour) endHour += 12;
  }
  
  // Generate ONLY the specific boxes for the hours this turf is actually open
  const hours = [];
  for (let i = startHour; i < endHour; i++) {
    hours.push(i % 24);
  }

  const adjustDate = (days) => {
    // Parse using noon to avoid timezone shift on toISOString
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    // Format safely to YYYY-MM-DD
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

    // Format safe date
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col ${standalone ? 'min-h-[70vh]' : ''}`}>
      
      {/* Schedule Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white z-10 relative">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Master Schedule</h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">
            Operating Hours: {openTime} to {closeTime}
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
          <button onClick={() => adjustDate(-1)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="w-32 text-center font-bold text-sm text-blue-700 uppercase tracking-widest">
            {getDisplayDate()}
          </div>
          <button onClick={() => adjustDate(1)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Interactive Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/30">
        <div className="min-w-[800px]">
          
          {/* Grid Header (Courts) */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-gray-100 z-20">
            <div className="w-24 shrink-0 border-r border-gray-200 p-3 bg-gray-100"></div>
            {courts.length === 0 ? (
              <div className="flex-1 p-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No courts registered</div>
            ) : (
              courts.map(court => (
                <div key={court._id || court.name} className="flex-1 p-3 text-center border-r border-gray-200 min-w-[200px]">
                  <h3 className="font-black text-gray-800 uppercase tracking-tighter text-sm truncate">{court.name}</h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-widest">{court.sport}</span>
                </div>
              ))
            )}
          </div>

          {/* Grid Body (Time Slots dynamically generated!) */}
          <div className="relative">
            {hours.map(hour => {
              const startH = hour;
              const endH = (hour + 1) % 24;
              const timeString = `${startH.toString().padStart(2, '0')}:00`;
              const endTimeString = `${endH.toString().padStart(2, '0')}:00`;
              const displayHour = startH > 12 ? `${startH - 12} PM` : startH === 12 ? '12 PM' : startH === 0 ? '12 AM' : `${startH} AM`;
              const fullSlotString = `${timeString} - ${endTimeString}`;

              return (
                <div key={hour} className="flex border-b border-gray-100 group">
                  
                  {/* Time Label */}
                  <div className="w-24 shrink-0 border-r border-gray-100 p-3 flex flex-col justify-start items-end bg-white">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayHour}</span>
                  </div>

                  {/* Court Columns for this specific hour */}
                  {courts.map(court => {
                    const slotBooking = bookings.find(b => 
                      b.date === dateStr && 
                      b.court === court.name &&           // backend field: 'court'
                      b.time === fullSlotString &&        // backend field: 'time' = "HH:00 - HH:00"
                      b.status !== 'Cancelled'
                    );

                    return (
                      <div key={`${court.name}-${hour}`} className="flex-1 min-w-[200px] border-r border-gray-100 relative p-1.5 bg-white transition-colors">
                        
                        {slotBooking ? (
                          (() => {
                            const isOnline = slotBooking.type === 'player_online';
                            return (
                              <button 
                                onClick={() => setDetailModal(slotBooking)} 
                                className={`h-full w-full rounded-lg p-3 border-l-4 shadow-sm flex flex-col justify-center relative overflow-hidden group/card cursor-pointer transition-all text-left text-white ${
                                  isOnline 
                                    ? 'bg-[#0a0a0a] border-[#01B636] hover:bg-black shadow-[0_4px_12px_rgba(1,182,54,0.1)]' 
                                    : 'bg-gray-900 border-yellow-400 hover:bg-gray-800'
                                }`}
                              >
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-[#01B636]' : 'bg-yellow-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-[#01B636]' : 'bg-yellow-500'}`}></span>
                                </span>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 truncate ${isOnline ? 'text-[#01B636]' : 'text-yellow-400'}`}>
                                  {isOnline ? '✅ PAID · ONLINE' : (slotBooking.status || 'Booked')}
                                </p>
                                <p className="text-sm font-black truncate leading-tight">
                                  {slotBooking.customerName || slotBooking.team || 'Player'}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-1">
                                  <p className="text-[10px] font-bold text-gray-500 truncate font-mono">
                                    LKR {(slotBooking.amount || 0).toLocaleString()}
                                  </p>
                                  {isOnline && (
                                    <span className="text-[7px] bg-[#01B636]/10 text-[#01B636] px-1.5 py-0.5 rounded border border-[#01B636]/30 font-black tracking-tighter uppercase">
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })()
                        ) : (
                          // AVAILABLE SLOT
                          <button 
                            onClick={() => setShowAddBooking({ 
                              courtName: court.name, 
                              timeSlot: fullSlotString, 
                              date: dateStr 
                            })}
                            className="h-full min-h-[80px] w-full rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span className="text-xl mb-1">+</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Lock {displayHour} Slot</span>
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