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
import ProfileSection from '../components/owner/ProfileSection';
import { X, Check, ChevronRight, Activity, Map, Calendar, Target, LogOut } from 'lucide-react';

// Shared Atomic Styles for Dark Mode Modals
const lbl = 'block text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1';
const inp = 'w-full px-5 py-4 bg-[#0A0F1C]/80 border-2 border-white/10 hover:border-white/20 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:bg-[#0A0F1C] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-300 shadow-inner';
const sel = `${inp} appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-slate-900 [&>option]:text-white`;

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('owner_active_tab') || 'bookings');

  useEffect(() => {
    sessionStorage.setItem('owner_active_tab', activeTab);
  }, [activeTab]);
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
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

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
        if (data.user) {
          setUser(data.user);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
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

  const handleAddCourt = async (courtData) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/owner/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...courtData, owner_id: user._id || user.id })
      });
      if (res.ok) {
        setShowAddCourtModal(false);
        fetchDashboardData(user._id || user.id);
      }
    } catch (err) {
      console.error("Failed to add court");
    }
  };

  const handleBulkUpdate = async (status) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/owner/courts/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: user._id || user.id, status })
      });
      if (res.ok) {
        setShowBulkModal(false);
        fetchDashboardData(user._id || user.id);
      }
    } catch (err) {
      console.error("Failed bulk update");
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

  // --- MIDNIGHT AURORA LOADING SCREEN ---
  if (isLoading || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse"></div>
      <div className="relative flex justify-center items-center z-10">
        <div className="absolute w-20 h-20 rounded-full bg-indigo-500/20 animate-ping"></div>
        <div className="relative w-14 h-14 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-indigo-300 font-black tracking-[0.2em] uppercase text-xs animate-pulse relative z-10">Initializing Workspace</p>
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
    setEditCourtModal,
    setShowAddCourtModal,
    setShowBulkModal
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'turfs': return <CourtManagement {...sharedProps} />;
      case 'bookings': return <BookingsSchedule {...sharedProps} standalone />;
      case 'calendar': return <AvailabilityCalendar {...sharedProps} />;
      case 'analytics': return <AnalyticsSection {...sharedProps} />;
      case 'profile': return <ProfileSection {...sharedProps} />;
      default:
        return (
          <div className="space-y-6 animate-in fade-in duration-700 relative z-10">
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
    <div className="flex bg-[#030712] font-sans text-slate-200 selection:bg-indigo-500/40 selection:text-white h-screen overflow-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`body{font-family:'Outfit',sans-serif; background-color: #030712;} .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 20px; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-[17rem] bg-[#0A0F1C]/80 backdrop-blur-3xl border-r border-white/10 hidden lg:flex flex-col z-[70] shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/10 shrink-0">
          <Target className="w-7 h-7 text-indigo-400 mr-3" />
          <span className="text-2xl font-black text-white tracking-tighter">FIND ME</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-2 custom-scrollbar">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Owner Portal</p>
           
           <button
             onClick={goBack}
             disabled={tabHistory.length <= 1}
             className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-black rounded-2xl transition-all duration-300 mb-2 ${tabHistory.length > 1
                 ? 'text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                 : 'text-slate-600 cursor-not-allowed opacity-50 border border-white/5'
               }`}
           >
             <ChevronRight className="w-4 h-4 rotate-180" /> Back
           </button>

           {[
             { id: 'dashboard', label: 'Overview', icon: <Activity className="w-5 h-5"/> },
             { id: 'bookings', label: 'Schedule', icon: <Calendar className="w-5 h-5"/> },
             { id: 'turfs', label: 'Courts', icon: <Map className="w-5 h-5"/> },
             { id: 'calendar', label: 'Calendar View', icon: <Calendar className="w-5 h-5"/> },
             { id: 'analytics', label: 'Analytics', icon: <Activity className="w-5 h-5"/> }
           ].map(tab => (
             <button key={tab.id} onClick={() => navigateTab(tab.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all duration-300 ${activeTab===tab.id?'bg-indigo-500/10 text-indigo-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20':'text-slate-400 hover:text-white hover:bg-white/5'}`}>
               <span className={`${activeTab===tab.id?'scale-110 transition-transform':''}`}>{tab.icon}</span> {tab.label}
             </button>
           ))}
        </div>
        
        <div className="p-4 border-t border-white/10 shrink-0 bg-white/[0.02]">
            <button onClick={()=>{sessionStorage.removeItem('user');navigate('/login');}} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
               <LogOut className="w-4 h-4"/> Logout
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden">
        {/* Deep Midnight Mesh Orbs */}
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>
        <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/4 -right-40 w-[40rem] h-[40rem] bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>

        {/* Top Header */}
        <div className="relative z-[60] shrink-0 border-b border-white/5">
          <OwnerHeader {...sharedProps} />
        </div>

        {/* Mobile / Tablet Dock Component */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[70]">
          <div className="pointer-events-auto bg-[#0A0F1C]/95 backdrop-blur-3xl p-2.5 rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.8)] ring-1 ring-white/20 flex gap-2 overflow-x-auto no-scrollbar max-w-full">
            <button
               onClick={goBack}
               disabled={tabHistory.length <= 1}
               className={`flex items-center gap-1 text-sm font-black px-4 py-2 rounded-[1.2rem] transition-all duration-300 border-r border-transparent ${tabHistory.length > 1
                   ? 'text-slate-300 hover:text-white hover:bg-white/10 mr-1 border-white/10'
                   : 'text-slate-600 cursor-not-allowed mr-1 border-white/5 opacity-50'
                 }`}
             >
               <ChevronRight className="w-4 h-4 rotate-180" />
             </button>
             {[
               { id: 'dashboard', label: 'Overview', icon: <Activity className="w-4 h-4"/> },
               { id: 'bookings', label: 'Schedule', icon: <Calendar className="w-4 h-4"/> },
               { id: 'turfs', label: 'Courts', icon: <Map className="w-4 h-4"/> },
               { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4"/> },
               { id: 'analytics', label: 'Analytics', icon: <Activity className="w-4 h-4"/> }
             ].map(tab => (
                <button key={tab.id} onClick={()=>navigateTab(tab.id)} className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm font-black rounded-[1.2rem] transition-all duration-300 ${activeTab===tab.id?'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]':'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                  <span className={`${activeTab===tab.id ? 'opacity-100 text-slate-900' : 'opacity-50'}`}>{tab.icon}</span>
                  {tab.label}
                </button>
             ))}
          </div>
        </div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar p-5 md:p-8 lg:p-10 pb-32 lg:pb-10">
          <div className="max-w-7xl mx-auto relative h-full">
            {renderContent()}
          </div>
        </main>
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

      {showAddCourtModal && (
        <AddCourtModal
          onClose={() => setShowAddCourtModal(false)}
          onSave={handleAddCourt}
        />
      )}

      {showBulkModal && (
        <BulkUpdateModal
          onClose={() => setShowBulkModal(false)}
          onConfirm={handleBulkUpdate}
        />
      )}
    </div>
  );
}

// --- PREMIUM DARK MODE MODALS ---

function AddBookingModal({ courts, onClose, onSave, prefill }) {
  const [form, setForm] = useState({
    customerName: '', phoneNumber: '',
    date: prefill?.date || new Date().toISOString().split('T')[0],
    timeSlot: prefill?.timeSlot || '06:00 PM - 07:00 PM',
    courtName: prefill?.courtName || courts[0]?.name || '',
    sport: courts.find(c => c.name === (prefill?.courtName || courts[0]?.name))?.sport || 'Futsal',
    players: 10, amount: 3500,
    type: 'manual' 
  });
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    if (isMaintenance) {
      setForm(prev => ({ 
        ...prev, 
        customerName: '🛠️ MAINTENANCE BLOCK', 
        phoneNumber: 'FACILITY', 
        amount: 0,
        type: 'maintenance'
      }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        customerName: '', 
        phoneNumber: '', 
        amount: 3500,
        type: 'manual'
      }));
    }
  }, [isMaintenance]);

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <form
        onSubmit={e => { e.preventDefault(); onSave(form); }}
        className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white/5 border-b border-white/10 p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-white font-black text-3xl tracking-tight leading-none mb-2">Manual Booking</h3>
              <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mt-1">Override Schedule</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300 backdrop-blur-md"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="px-8 pt-6">
          <div className="flex bg-[#030712] p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setIsMaintenance(false)}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${!isMaintenance ? 'bg-indigo-500 text-white shadow-xl ring-4 ring-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Customer Booking
            </button>
            <button
              type="button"
              onClick={() => setIsMaintenance(true)}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${isMaintenance ? 'bg-amber-500 text-slate-900 shadow-xl ring-4 ring-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Maintenance Block
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className={isMaintenance ? 'opacity-50 pointer-events-none' : ''}>
              <label className={lbl}>Customer Name</label>
              <input
                required
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                className={inp}
                placeholder="John Doe"
              />
            </div>
            <div className={isMaintenance ? 'opacity-50 pointer-events-none' : ''}>
              <label className={lbl}>Phone Number</label>
              <input
                required
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className={inp}
                placeholder="07XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Time Slot</label>
              <input
                required
                value={form.timeSlot}
                onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                className={inp}
                placeholder="18:00 - 19:00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 bg-indigo-500/10 p-6 rounded-3xl ring-1 ring-indigo-500/30">
            <div>
              <label className={`${lbl} !text-indigo-200`}>Assign Court</label>
              <select
                value={form.courtName}
                onChange={e => {
                  const c = courts.find(c => c.name === e.target.value);
                  setForm({ ...form, courtName: e.target.value, sport: c?.sport || form.sport });
                }}
                className={sel}
              >
                {courts.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`${lbl} !text-indigo-200`}>Amount (LKR)</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className={inp}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 sm:p-8 pt-4 flex gap-4 bg-transparent border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:bg-white/10 hover:text-white ring-1 ring-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${isMaintenance ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/20' : 'bg-white hover:bg-slate-200 text-slate-900 shadow-indigo-500/30'}`}
          >
            {isMaintenance ? 'Initialize Maintenance' : 'Confirm Booking'}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}

function EditBookingModal({ booking, onClose, onUpdateStatus }) {
  if (!booking) return null;

  const statusColors = {
    Confirmed: 'text-emerald-400 bg-emerald-500/20 ring-emerald-500/40',
    Pending: 'text-amber-400 bg-amber-500/20 ring-amber-500/40',
    Cancelled: 'text-rose-400 bg-rose-500/20 ring-rose-500/40',
  };

  return (
    <div
      className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white/5 border-b border-white/10 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-white font-black text-3xl tracking-tight leading-none mb-2">Manage Slot</h3>
              <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mt-1">
                {booking.date} &nbsp;•&nbsp; {booking.time || booking.timeSlot || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300 backdrop-blur-md"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <p className={lbl}>Player / Squad</p>
            <p className="text-2xl font-black text-white tracking-tight">{booking.team || booking.customerName || 'Unknown'}</p>
          </div>

          {(booking.user_phone || booking.user_email) && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/30">
              {booking.user_phone && (
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-white">{booking.user_phone}</p>
                </div>
              )}
              {booking.user_email && (
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-xs font-bold text-slate-300 truncate">{booking.user_email}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-end border-t border-white/10 pt-6">
            <div>
              <p className={lbl}>Court</p>
              <p className="font-bold text-lg text-white">{booking.court || booking.courtName || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className={lbl}>Amount</p>
              <p className="font-black text-2xl text-indigo-400 tracking-tighter">LKR {(booking.amount || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <p className={lbl + " !mb-0"}>Status</p>
            <span className={`text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl ring-1 ${statusColors[booking.status] || 'text-slate-400 bg-white/5 ring-white/20'}`}>
              {booking.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-2 flex flex-col gap-3 bg-transparent border-t border-white/5">
          <button
            onClick={() => onUpdateStatus(booking.id || booking._id, 'Confirmed')}
            disabled={booking.status === 'Confirmed'}
            className="w-full py-4 bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            ✓ Mark as Confirmed
          </button>
          <button
            onClick={() => onUpdateStatus(booking.id || booking._id, 'Cancelled')}
            disabled={booking.status === 'Cancelled'}
            className="w-full py-4 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 rounded-2xl font-black text-sm uppercase tracking-widest ring-1 ring-rose-500/40 transition-all active:scale-[0.98]"
          >
            ✕ Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto py-20" onClick={onClose}>
      <div className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden my-auto transform transition-all animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="bg-white/5 border-b border-white/10 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-white font-black text-3xl tracking-tight leading-none mb-2">Edit Court</h3>
              <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mt-1">{form.name || 'New Court'}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300 backdrop-blur-md"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-5">
            <div>
              <label className={lbl}>Court Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Sport</label>
                <select value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })} className={sel}>
                  <option value="Futsal">Futsal</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Tennis">Tennis</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inp} />
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 p-6 rounded-3xl ring-1 ring-indigo-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-indigo-500/20 pb-4">
              <div>
                <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest">Custom Rates</h4>
                <p className="text-[10px] text-indigo-200/70 mt-1 font-bold">Override global turf pricing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasCustomPricing} onChange={(e) => setHasCustomPricing(e.target.checked)} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 ring-1 ring-white/10"></div>
              </label>
            </div>

            {hasCustomPricing && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                {!hasDayNightPricing && !hasWeekendPricing && (
                  <div className="relative">
                    <div className="absolute left-5 top-4 text-sm font-black text-slate-500">LKR</div>
                    <input type="number" placeholder="Standard Hourly Rate" className={`${inp} pl-16 font-mono text-lg`} value={form.standard_rate} onChange={(e) => setForm({ ...form, standard_rate: e.target.value })} />
                  </div>
                )}
                {hasDayNightPricing && !hasWeekendPricing && (
                  <div className="flex gap-4">
                    <input type="number" placeholder="Day Rate" className={`${inp} font-mono`} value={form.day_rate} onChange={(e) => setForm({ ...form, day_rate: e.target.value })} />
                    <input type="number" placeholder="Night Rate" className={`${inp} font-mono`} value={form.night_rate} onChange={(e) => setForm({ ...form, night_rate: e.target.value })} />
                  </div>
                )}
                {!hasDayNightPricing && hasWeekendPricing && (
                  <div className="flex gap-4">
                    <input type="number" placeholder="Weekday Rate" className={`${inp} font-mono`} value={form.weekday_rate} onChange={(e) => setForm({ ...form, weekday_rate: e.target.value })} />
                    <input type="number" placeholder="Weekend Rate" className={`${inp} font-mono`} value={form.weekend_rate} onChange={(e) => setForm({ ...form, weekend_rate: e.target.value })} />
                  </div>
                )}
                {hasDayNightPricing && hasWeekendPricing && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block text-center">Weekday</span>
                      <input type="number" placeholder="Day" className={`${inp} !py-3 font-mono`} value={form.weekday_day_rate} onChange={(e) => setForm({ ...form, weekday_day_rate: e.target.value })} />
                      <input type="number" placeholder="Night" className={`${inp} !py-3 font-mono`} value={form.weekday_night_rate} onChange={(e) => setForm({ ...form, weekday_night_rate: e.target.value })} />
                    </div>
                    <div className="space-y-3 bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block text-center">Weekend</span>
                      <input type="number" placeholder="Day" className={`${inp} !py-3 font-mono`} value={form.weekend_day_rate} onChange={(e) => setForm({ ...form, weekend_day_rate: e.target.value })} />
                      <input type="number" placeholder="Night" className={`${inp} !py-3 font-mono`} value={form.weekend_night_rate} onChange={(e) => setForm({ ...form, weekend_night_rate: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-indigo-500/20">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={hasDayNightPricing} onChange={(e) => setHasDayNightPricing(e.target.checked)} className="w-4 h-4 accent-indigo-500 cursor-pointer rounded ring-1 ring-white/20 bg-transparent" />
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest group-hover:text-white transition-colors">Different Day / Night</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={hasWeekendPricing} onChange={(e) => setHasWeekendPricing(e.target.checked)} className="w-4 h-4 accent-indigo-500 cursor-pointer rounded ring-1 ring-white/20 bg-transparent" />
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest group-hover:text-white transition-colors">Different Weekends</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-2 border-t border-white/5 bg-transparent flex gap-4 rounded-b-[2rem]">
          <button onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 ring-1 ring-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-white hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function AddCourtModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', sport: 'Futsal', capacity: 10, price_per_hour: 3500
  });

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <form
        onSubmit={e => { e.preventDefault(); onSave(form); }}
        className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white/5 border-b border-white/10 p-8">
          <h3 className="text-white font-black text-2xl tracking-tight">Add New Court</h3>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Register a new facility</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className={lbl}>Court Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Ex: Mini Pitch A" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Sport</label>
              <select value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })} className={sel}>
                <option value="Futsal">Futsal</option>
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Badminton">Badminton</option>
                <option value="Tennis">Tennis</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Capacity</label>
              <input type="number" required value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Hourly Rate (LKR)</label>
            <input type="number" required value={form.price_per_hour} onChange={e => setForm({ ...form, price_per_hour: e.target.value })} className={inp} />
          </div>
        </div>
        <div className="p-8 flex gap-4 border-t border-white/5">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest ring-1 ring-white/10">Cancel</button>
          <button type="submit" className="flex-1 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Create Court</button>
        </div>
      </form>
    </div>
  );
}

function BulkUpdateModal({ onClose, onConfirm }) {
  const [status, setStatus] = useState('Available');

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-black text-2xl tracking-tight mb-2">Bulk Update</h3>
        <p className="text-slate-400 text-sm mb-8">Change the status of <b className="text-white">all registered courts</b> instantly.</p>
        
        <div className="space-y-4 mb-10">
          {['Available', 'Maintenance', 'Holiday'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`w-full py-4 px-6 rounded-2xl text-left border-2 transition-all duration-300 font-bold flex items-center justify-between ${
                status === s ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${s === 'Available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : s === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                {s}
              </div>
              {status === s && <Check className="w-5 h-5 text-indigo-400" />}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest ring-1 ring-white/10">Cancel</button>
          <button onClick={() => onConfirm(status)} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.4)]">Apply to All</button>
        </div>
      </div>
    </div>
  );
}