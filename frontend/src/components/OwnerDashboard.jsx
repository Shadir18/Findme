import { useState, useEffect } from 'react';

export default function OwnerDashboard({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fullSchedule, setFullSchedule] = useState({}); // Structure: { "2023-10-25": { "6:00...": {} } }
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const timeSlots = [];
  for (let i = 6; i < 24; i++) {
    timeSlots.push(`${i}:00 - ${i + 1}:00`);
  }

  // Fetch all bookings for this indoor
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/indoors/nearby?email=${user.email}`);
        const data = await response.json();
        if (data.length > 0) setFullSchedule(data[0].calendar_availability || {});
      } catch (err) { console.error("Fetch error:", err); }
    };
    fetchAllBookings();
  }, [user.email]);

  const currentDaySchedule = fullSchedule[selectedDate] || {};

  const handleSlotUpdate = (slotTime, data) => {
    const updatedFullSchedule = {
      ...fullSchedule,
      [selectedDate]: {
        ...(fullSchedule[selectedDate] || {}),
        [slotTime]: data
      }
    };
    setFullSchedule(updatedFullSchedule);
    setSelectedSlot(null);
  };

  const saveToCloud = async () => {
    setIsSaving(true);
    try {
      await fetch('http://127.0.0.1:5000/api/indoor/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, calendar_availability: fullSchedule }),
      });
      alert("SUCCESS: Calendar Synced with Cloud!");
    } catch (err) { alert("Error syncing data."); } finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto pt-10 px-6 pb-20 font-sans">
      
      {/* TOP CONTROL BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
            TURF <span className="text-blue-500">MASTER</span>
          </h2>
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.4em] mt-2">Facility: {user.indoor_name || user.name}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-blue-600/20 p-2 rounded-2xl border border-blue-500/30 flex items-center gap-4">
            <span className="pl-4 text-[10px] font-black uppercase text-blue-400">Select Date</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#0f172a] text-white font-black p-3 rounded-xl outline-none border border-white/10 focus:border-blue-500 cursor-pointer"
            />
          </div>
          <button 
            onClick={saveToCloud}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
          >
            {isSaving ? "SAVING..." : "SYNC CALENDAR"}
          </button>
        </div>
      </div>

      {/* BIG BOLD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {timeSlots.map(slot => {
          const data = currentDaySchedule[slot] || { status: 'Available' };
          const isBooked = data.status === 'Booked';
          const isMaint = data.status === 'Maintenance';

          return (
            <div 
              key={slot}
              onClick={() => setSelectedSlot({ time: slot, ...data })}
              className={`relative h-48 rounded-[2.5rem] p-8 border-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between ${
                isBooked ? 'border-red-600 bg-red-600/10' : 
                isMaint ? 'border-amber-500 bg-amber-500/10' : 
                'border-emerald-500 bg-emerald-500/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-white font-black text-2xl tracking-tighter italic">{slot}</span>
                <div className={`w-4 h-4 rounded-full animate-pulse ${isBooked ? 'bg-red-500' : isMaint ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              </div>

              <div>
                {isBooked ? (
                  <>
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Customer</p>
                    <p className="text-2xl font-black text-white truncate leading-none mt-1">{data.customerName || "System Booking"}</p>
                    <p className="text-xs font-bold text-red-400/70 mt-1">{data.customerPhone || "N/A"}</p>
                  </>
                ) : (
                  <p className="text-lg font-black uppercase italic tracking-widest text-emerald-500/50">
                    {isMaint ? "MAINTENANCE" : "READY TO PLAY"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL (Big & Clear) */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="w-full max-w-xl bg-[#0f172a] border-4 border-white/10 p-12 rounded-[4rem] shadow-[0_0_100px_rgba(37,99,235,0.2)]">
            <h3 className="text-4xl font-black text-white italic uppercase mb-2">Edit Booking</h3>
            <p className="text-blue-500 font-black text-xl mb-10 tracking-widest">{selectedSlot.time} • {selectedDate}</p>

            <div className="space-y-8">
              <div className="flex gap-4">
                {['Available', 'Booked', 'Maintenance'].map(s => (
                  <button key={s} onClick={() => setSelectedSlot({...selectedSlot, status: s})}
                    className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                      selectedSlot.status === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 border border-white/5'
                    }`}>{s}</button>
                ))}
              </div>

              {selectedSlot.status === 'Booked' && (
                <div className="space-y-4">
                  <input type="text" placeholder="CUSTOMER NAME" className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-2xl text-white text-xl font-bold outline-none focus:border-blue-500"
                    value={selectedSlot.customerName || ''} onChange={(e) => setSelectedSlot({...selectedSlot, customerName: e.target.value.toUpperCase()})} />
                  <input type="tel" placeholder="PHONE NUMBER" className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-2xl text-white text-xl font-bold outline-none focus:border-blue-500 font-mono"
                    value={selectedSlot.customerPhone || ''} onChange={(e) => setSelectedSlot({...selectedSlot, customerPhone: e.target.value})} />
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button onClick={() => setSelectedSlot(null)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest">Close</button>
                <button onClick={() => handleSlotUpdate(selectedSlot.time, selectedSlot)} className="flex-2 bg-blue-600 py-6 rounded-[2rem] text-white font-black uppercase tracking-[0.2em] shadow-xl">Apply to Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}