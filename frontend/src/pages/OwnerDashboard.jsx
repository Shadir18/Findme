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
  const [activeTab, setActiveTab] = useState('bookings'); // Default to Bookings tab instead of Dashboard
  const [bookingFilter, setBookingFilter] = useState('today');
  
  // Real State from Backend
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [notifications, setNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [addBookingPrefill, setAddBookingPrefill] = useState(null);

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
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role !== 'turf_owner') { 
        navigate('/login'); 
        return; 
      }
      setUser(parsed);
      fetchDashboardData(parsed._id || 'demo_owner_id'); // Ensure _id is passed
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

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/owner/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        setDetailModal(null); // Close modal if open
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
        // Refresh analytics as well
        fetchDashboardData(user._id || 'demo_owner_id'); 
      }
    } catch (err) {
      console.error("Failed to add manual booking");
    }
  };

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Loading Workspace...</p>
      </div>
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
    setShowAddBooking: handleOpenAddBooking
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'turfs':      return <CourtManagement {...sharedProps} />;
      case 'bookings':   return <BookingsSchedule {...sharedProps} standalone />; // Used BookingsSchedule for superior managing
      case 'calendar':   return <AvailabilityCalendar {...sharedProps} />;
      case 'analytics':  return <AnalyticsSection {...sharedProps} />;
      default:
        return (
          <div className="space-y-6">
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
                <RecentBookings {...sharedProps} compact />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10 text-gray-800">
      <OwnerHeader {...sharedProps} />
      
      {/* Dynamic Sub-Navigation Header with Go Back */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={goBack}
            disabled={tabHistory.length <= 1}
            className={`flex items-center gap-1 text-sm font-semibold pr-3 border-r border-gray-200 transition ${tabHistory.length > 1 ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             Back
          </button>
          
          {[
            { id: 'bookings', label: 'Today\'s Bookings' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'turfs', label: 'Court Management' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-bold rounded-lg transition ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
        {renderContent()}
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <OwnerBottomNav activeTab={activeTab} setActiveTab={navigateTab} />
      </div>

      {showAddBooking && <AddBookingModal courts={courts} onClose={() => setShowAddBooking(false)} onSave={handleAddManualBooking} prefill={addBookingPrefill} />}
    </div>
  );
}

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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
          <h3 className="text-gray-800 font-bold text-lg">Add Manual Booking</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Customer Name</label><input required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="John Doe" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number</label><input required value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="07XXXXXXXX" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Time Slot</label><input required value={form.timeSlot} onChange={e => setForm({...form, timeSlot: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="18:00 - 19:00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Court</label>
              <select value={form.courtName} onChange={e => {
                const c = courts.find(c => c.name === e.target.value);
                setForm({...form, courtName: e.target.value, sport: c?.sport || form.sport });
              }} className="w-full border border-gray-300 rounded p-2 text-sm">
                {courts.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (LKR)</label><input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" /></div>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded shadow-sm transition">Create Booking</button>
      </form>
    </div>
  );
}
