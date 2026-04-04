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
  
  const startHour = parseInt(openTime.split(':')[0], 10);
  const endHour = parseInt(closeTime.split(':')[0], 10);
  
  // Generate ONLY the specific boxes for the hours this turf is actually open
  const hours = [];
  for (let i = startHour; i < endHour; i++) {
    hours.push(i);
  }

  const adjustDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getDisplayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Today";
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return "Tomorrow";

    return new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
              const timeString = `${hour.toString().padStart(2, '0')}:00`;
              const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
              const fullSlotString = `${timeString} - ${(hour + 1).toString().padStart(2, '0')}:00`;

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
                          // --- UPDATED BOOKED SLOT (Now Clickable!) ---
                          <button 
                            onClick={() => setDetailModal(slotBooking)} 
                            className="h-full w-full bg-gray-900 rounded-lg p-3 border-l-4 border-yellow-400 shadow-sm flex flex-col justify-center relative overflow-hidden group/card cursor-pointer hover:bg-gray-800 transition-colors text-left text-white"
                          >
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1 truncate">
                              {slotBooking.status || 'Booked'}
                            </p>
                            <p className="text-sm font-black truncate">{slotBooking.customerName || slotBooking.player_name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 truncate font-mono">LKR {slotBooking.amount || slotBooking.price}</p>
                          </button>
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