import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerKPICards from '../components/owner/OwnerKPICards';
import BookingsSchedule from '../components/owner/BookingsSchedule';
import CourtManagement from '../components/owner/CourtManagement';
import AvailabilityCalendar from '../components/owner/AvailabilityCalendar';
import RecentBookings from '../components/owner/RecentBookings';
import AnalyticsSection from '../components/owner/AnalyticsSection';
import QuickActions from '../components/owner/QuickActions';
import OwnerBottomNav from '../components/owner/OwnerBottomNav';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [bookingFilter, setBookingFilter] = useState('today');
  
  // Real State from Backend
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [addBookingPrefill, setAddBookingPrefill] = useState(null);
  const [editCourtModal, setEditCourtModal] = useState(null);

  // Store history for back button
  const [tabHistory, setTabHistory] = useState(['bookings']);

  const navigateTab = (newTab) => {
    setTabHistory(prev => [...prev, newTab]);
    setActiveTab(newTab);
  };

  const goBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop();
      const previous = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      setActiveTab(previous);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role !== 'turf_owner') { 
        navigate('/login'); 
        return; 
      }
      setUser(parsed);
      fetchDashboardData(parsed._id || 'demo_owner_id'); 
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async (ownerId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/owner/dashboard?owner_id=${ownerId}`);
      if (res.ok) {
        const data = await res.json();
        setCourts(data.courts || []);
        setBookings(data.bookings || []);
        setAnalytics(data.analytics || null);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourtStatus = async (courtId, statusStr) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/owner/courts/${courtId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusStr })
      });
      if (res.ok) {
        const data = await res.json();
        setCourts(prev => prev.map(c => c._id === courtId ? { ...c, status: data.status, available: data.available } : c));
      }
    } catch (err) {
      console.error("Failed to update court status");
    }
  };

  const updateCourtDetails = async (courtId, updatedFields) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/owner/courts/${courtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setCourts(prev => prev.map(c => c._id === courtId ? { ...c, ...data.court } : c));
        setEditCourtModal(null);
      }
    } catch (err) {
      console.error("Failed to update court details");
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/owner/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        setDetailModal(null); 
      }
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const handleAddManualBooking = async (formData) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/owner/bookings/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, owner_id: user._id || 'demo_owner_id' })
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(prev => [...prev, data.booking]);
        setShowAddBooking(false);
        fetchDashboardData(user._id || 'demo_owner_id'); 
      }
    } catch (err) {
      console.error("Failed to add manual booking");
    }
  };

  // --- UPGRADED LOADING SCREEN ---
  if (isLoading || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="relative flex justify-center items-center">
        <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-100"></div>
        <div className="relative w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing Workspace...</p>
    </div>
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr);
  const upcomingBookings = bookings.filter(b => b.date >= todayStr);
  const totalRevenueMonth = bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + (b.amount || 0), 0);
  const availableToday = courts.filter(c => c.available !== false).length; 
  const utilizationRate = courts.length ? Math.round(((courts.length - availableToday) / courts.length) * 100) : 0;

  const filteredBookings = bookings.filter(b => {
    const safeTeam = b.team || '';
    const safeSport = b.sport || '';
    
    const matchSearch = !searchQuery ||
      safeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeSport.toLowerCase().includes(searchQuery.toLowerCase());

    if (bookingFilter === 'today') return b.date === todayStr && matchSearch;
    if (bookingFilter === 'week') return b.date >= todayStr && matchSearch;
    return matchSearch;
  });

  const handleOpenAddBooking = (prefillData = null) => {
    setAddBookingPrefill(prefillData);
    setShowAddBooking(true);
  };

  const sharedProps = {
    user, todayBookings, upcomingBookings, totalRevenueMonth,
    availableToday, utilizationRate, courts, updateCourtStatus, updateBookingStatus,
    bookings, analytics,
    filteredBookings, bookingFilter, setBookingFilter,
    searchQuery, setSearchQuery, notifications, setNotifications,
    showNotifications, setShowNotifications,
    selectedDate, setSelectedDate, detailModal, setDetailModal,
    setActiveTab: navigateTab, fetchDashboardData,
    setShowAddBooking: handleOpenAddBooking,
    setEditCourtModal
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'turfs':      return <CourtManagement {...sharedProps} />;
      case 'bookings':   return <BookingsSchedule {...sharedProps} standalone />; 
      case 'calendar':   return <AvailabilityCalendar {...sharedProps} />;
      case 'analytics':  return <AnalyticsSection {...sharedProps} />;
      default:
        return (
          <div className="space-y-6 animate-fadeIn">
            <OwnerKPICards {...sharedProps} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <BookingsSchedule {...sharedProps} />
                <AvailabilityCalendar {...sharedProps} />
                <AnalyticsSection {...sharedProps} compact />
              </div>
              <div className="space-y-6">
                <QuickActions {...sharedProps} />
                <CourtManagement {...sharedProps} compact />
                <RecentBookings {...sharedProps} compact onSelect={setDetailModal} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24 lg:pb-10 text-gray-800">
      <OwnerHeader {...sharedProps} />
      
      {/* --- UPGRADED SUB-NAVIGATION --- */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          
          <button 
            onClick={goBack}
            disabled={tabHistory.length <= 1}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all border-r border-transparent ${
              tabHistory.length > 1 
                ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 mr-2 border-gray-200' 
                : 'text-gray-300 cursor-not-allowed mr-2 border-gray-100'
            }`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             Back
          </button>
          
          {[
            { id: 'bookings', label: 'Today\'s Bookings' },
            { id: 'dashboard', label: 'Overview' },
            { id: 'turfs', label: 'Court Management' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gray-900 text-white shadow-md transform scale-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-12">
        {renderContent()}
      </main>
      
      <div className="lg:hidden">
        <OwnerBottomNav activeTab={activeTab} setActiveTab={navigateTab} />
      </div>

      {showAddBooking && (
        <AddBookingModal 
          courts={courts} 
          onClose={() => setShowAddBooking(false)} 
          onSave={handleAddManualBooking} 
          prefill={addBookingPrefill} 
        />
      )}

      {detailModal && (
        <EditBookingModal
          booking={detailModal}
          onClose={() => setDetailModal(null)}
          onUpdateStatus={updateBookingStatus}
        />
      )}

      {editCourtModal && (
        <EditCourtModal
          court={editCourtModal}
          onClose={() => setEditCourtModal(null)}
          onUpdateCourt={updateCourtDetails}
        />
      )}
    </div>
  );
}

// --- UPGRADED MODAL COMPONENT ---
function AddBookingModal({ courts, onClose, onSave, prefill }) {
  const [form, setForm] = useState({
    customerName: '', phoneNumber: '', 
    date: prefill?.date || new Date().toISOString().split('T')[0],
    timeSlot: prefill?.timeSlot || '18:00 - 19:00', 
    courtName: prefill?.courtName || courts[0]?.name || '', 
    sport: courts.find(c => c.name === (prefill?.courtName || courts[0]?.name))?.sport || 'Futsal',
    players: 10, amount: 3500
  });

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      
      <form 
        onSubmit={e => { e.preventDefault(); onSave(form); }} 
        className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">Manual Booking</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Override Schedule</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Customer Name</label>
              <input 
                required 
                value={form.customerName} 
                onChange={e => setForm({...form, customerName: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="John Doe" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
              <input 
                required 
                value={form.phoneNumber} 
                onChange={e => setForm({...form, phoneNumber: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="07XXXXXXXX" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Date</label>
              <input 
                type="date" 
                required 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Time Slot</label>
              <input 
                required 
                value={form.timeSlot} 
                onChange={e => setForm({...form, timeSlot: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="18:00 - 19:00" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div>
              <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1 mb-2 block">Assign Court</label>
              <select 
                value={form.courtName} 
                onChange={e => {
                  const c = courts.find(c => c.name === e.target.value);
                  setForm({...form, courtName: e.target.value, sport: c?.sport || form.sport });
                }} 
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                {courts.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1 mb-2 block">Amount (LKR)</label>
              <input 
                type="number" 
                required 
                value={form.amount} 
                onChange={e => setForm({...form, amount: e.target.value})} 
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-[2rem]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transform active:scale-95 transition-all"
          >
            Confirm Booking
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Edit Booking Modal ───────────────────────────────────────────────────────
function EditBookingModal({ booking, onClose, onUpdateStatus }) {
  if (!booking) return null;

  const statusColors = {
    Confirmed: 'text-green-600 bg-green-50 border-green-200',
    Pending:   'text-yellow-600 bg-yellow-50 border-yellow-200',
    Cancelled: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">Manage Booking</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">
              {booking.date} &nbsp;|&nbsp; {booking.time || booking.timeSlot || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-7 space-y-4">
          {/* Player / Squad */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Player / Squad</p>
            <p className="text-lg font-black text-gray-800">{booking.team || booking.customerName || 'Unknown'}</p>
          </div>

          {/* Phone + Email */}
          {(booking.user_phone || booking.user_email) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              {booking.user_phone && (
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="text-sm font-bold text-gray-800">{booking.user_phone}</p>
                </div>
              )}
              {booking.user_email && (
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-xs font-bold text-gray-700 truncate">{booking.user_email}</p>
                </div>
              )}
            </div>
          )}

          {/* Court + Revenue */}
          <div className="flex justify-between items-center border-t border-gray-100 pt-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Court</p>
              <p className="font-bold text-gray-700">{booking.court || booking.courtName || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount</p>
              <p className="font-black text-blue-600 font-mono">LKR {(booking.amount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Current status badge */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Status</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[booking.status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
              {booking.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 rounded-b-[2rem]">
          <button
            onClick={() => onUpdateStatus(booking.id || booking._id, 'Confirmed')}
            disabled={booking.status === 'Confirmed'}
            className="w-full py-3 bg-gray-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
          >
            ✓ Mark as Confirmed / Paid
          </button>
          <button
            onClick={() => onUpdateStatus(booking.id || booking._id, 'Cancelled')}
            disabled={booking.status === 'Cancelled'}
            className="w-full py-3 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-red-600 rounded-xl font-black text-xs uppercase tracking-widest border border-red-200 transition-colors"
          >
            ✕ Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Court Modal ───────────────────────────────────────────────────────
function EditCourtModal({ court, onClose, onUpdateCourt }) {
  const [hasCustomPricing, setHasCustomPricing] = useState(!!court.pricing);
  const [hasDayNightPricing, setHasDayNightPricing] = useState(
    court.pricing ? court.pricing.weekday?.day !== court.pricing.weekday?.night : false
  );
  const [hasWeekendPricing, setHasWeekendPricing] = useState(
    court.pricing ? court.pricing.weekday?.day !== court.pricing.weekend?.day : false
  );

  const [form, setForm] = useState({
    name: court.name || '',
    sport: court.sport || 'Futsal',
    capacity: court.capacity || 10,
    
    standard_rate: court.pricing?.weekday?.day || court.price_per_hour || '',
    day_rate: court.pricing?.weekday?.day || '',
    night_rate: court.pricing?.weekday?.night || '',
    weekday_rate: court.pricing?.weekday?.day || '',
    weekend_rate: court.pricing?.weekend?.day || '',
    weekday_day_rate: court.pricing?.weekday?.day || '',
    weekday_night_rate: court.pricing?.weekday?.night || '',
    weekend_day_rate: court.pricing?.weekend?.day || '',
    weekend_night_rate: court.pricing?.weekend?.night || ''
  });

  const handleSave = () => {
    let finalPricing = null;
    if (hasCustomPricing) {
      if (!hasDayNightPricing && !hasWeekendPricing) {
        finalPricing = { 
          weekday: { day: form.standard_rate, night: form.standard_rate }, 
          weekend: { day: form.standard_rate, night: form.standard_rate } 
        };
      } else if (hasDayNightPricing && !hasWeekendPricing) {
        finalPricing = { 
          weekday: { day: form.day_rate, night: form.night_rate }, 
          weekend: { day: form.day_rate, night: form.night_rate } 
        };
      } else if (!hasDayNightPricing && hasWeekendPricing) {
        finalPricing = { 
          weekday: { day: form.weekday_rate, night: form.weekday_rate }, 
          weekend: { day: form.weekend_rate, night: form.weekend_rate } 
        };
      } else {
        finalPricing = { 
          weekday: { day: form.weekday_day_rate, night: form.weekday_night_rate }, 
          weekend: { day: form.weekend_day_rate, night: form.weekend_night_rate } 
        };
      }
    }
    
    onUpdateCourt(court._id || court.id, {
      name: form.name,
      sport: form.sport,
      capacity: form.capacity,
      pricing: finalPricing
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn overflow-y-auto pt-20 pb-20" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">Edit Court</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">{form.name || 'New Court'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-sm">✕</button>
        </div>

        <div className="p-7 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Court Name</label>
              <input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Sport</label>
                <select 
                  value={form.sport} 
                  onChange={e => setForm({...form, sport: e.target.value})} 
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Futsal">Futsal</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Tennis">Tennis</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Capacity</label>
                <input 
                  type="number" 
                  value={form.capacity} 
                  onChange={e => setForm({...form, capacity: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
             <div className="flex items-center justify-between mb-3 border-b border-blue-200/50 pb-2">
                <div>
                   <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest">Custom Rates</h4>
                   <p className="text-[9px] text-blue-600 mt-0.5 font-semibold">Override global turf pricing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={hasCustomPricing} onChange={(e) => setHasCustomPricing(e.target.checked)} />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>

             {hasCustomPricing && (
                <div className="space-y-4 animate-fadeIn mt-4">
                   {!hasDayNightPricing && !hasWeekendPricing && (
                     <div className="relative">
                       <div className="absolute left-4 top-3 text-xs font-bold text-gray-400">LKR</div>
                       <input type="number" placeholder="Standard Hourly Rate" className="w-full pl-12 pr-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm font-mono" value={form.standard_rate} onChange={(e) => setForm({...form, standard_rate: e.target.value})} />
                     </div>
                   )}
                   {hasDayNightPricing && !hasWeekendPricing && (
                     <div className="flex gap-3">
                       <input type="number" placeholder="Day Rate" className="w-full px-3 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-xs font-mono" value={form.day_rate} onChange={(e) => setForm({...form, day_rate: e.target.value})} />
                       <input type="number" placeholder="Night Rate" className="w-full px-3 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-xs font-mono" value={form.night_rate} onChange={(e) => setForm({...form, night_rate: e.target.value})} />
                     </div>
                   )}
                   {!hasDayNightPricing && hasWeekendPricing && (
                     <div className="flex gap-3">
                       <input type="number" placeholder="Weekday Rate" className="w-full px-3 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-xs font-mono" value={form.weekday_rate} onChange={(e) => setForm({...form, weekday_rate: e.target.value})} />
                       <input type="number" placeholder="Weekend Rate" className="w-full px-3 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-xs font-mono" value={form.weekend_rate} onChange={(e) => setForm({...form, weekend_rate: e.target.value})} />
                     </div>
                   )}
                   {hasDayNightPricing && hasWeekendPricing && (
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2 bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                         <span className="text-[9px] font-bold text-blue-800 uppercase tracking-widest block text-center">Weekday</span>
                         <input type="number" placeholder="Day" className="w-full px-2 py-2 rounded-lg border border-blue-100 focus:border-blue-400 outline-none text-xs font-mono bg-gray-50" value={form.weekday_day_rate} onChange={(e) => setForm({...form, weekday_day_rate: e.target.value})} />
                         <input type="number" placeholder="Night" className="w-full px-2 py-2 rounded-lg border border-blue-100 focus:border-blue-400 outline-none text-xs font-mono bg-gray-50" value={form.weekday_night_rate} onChange={(e) => setForm({...form, weekday_night_rate: e.target.value})} />
                       </div>
                       <div className="space-y-2 bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                         <span className="text-[9px] font-bold text-blue-800 uppercase tracking-widest block text-center">Weekend</span>
                         <input type="number" placeholder="Day" className="w-full px-2 py-2 rounded-lg border border-blue-100 focus:border-blue-400 outline-none text-xs font-mono bg-gray-50" value={form.weekend_day_rate} onChange={(e) => setForm({...form, weekend_day_rate: e.target.value})} />
                         <input type="number" placeholder="Night" className="w-full px-2 py-2 rounded-lg border border-blue-100 focus:border-blue-400 outline-none text-xs font-mono bg-gray-50" value={form.weekend_night_rate} onChange={(e) => setForm({...form, weekend_night_rate: e.target.value})} />
                       </div>
                     </div>
                   )}

                   <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-blue-200/50">
                     <label className="flex items-center gap-2 cursor-pointer group">
                       <input type="checkbox" checked={hasDayNightPricing} onChange={(e) => setHasDayNightPricing(e.target.checked)} className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
                       <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest group-hover:text-blue-900 transition-colors">Different Day / Night</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer group">
                       <input type="checkbox" checked={hasWeekendPricing} onChange={(e) => setHasWeekendPricing(e.target.checked)} className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
                       <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest group-hover:text-blue-900 transition-colors">Different Weekends</span>
                     </label>
                   </div>
                </div>
             )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-[2rem]">
           <button onClick={onClose} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest transition-colors">Cancel</button>
           <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transform active:scale-95 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
}