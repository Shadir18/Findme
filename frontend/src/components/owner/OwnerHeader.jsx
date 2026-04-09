import { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, User, Settings, X, Check, Calendar, CreditCard, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFS = [
  { id: 1, type: 'booking', message: 'New booking: Smash Bros – Court B, 9:00 AM', time: '5 min ago', unread: true },
  { id: 2, type: 'cancel', message: 'Cancellation: Village Stars – Court C, Apr 1', time: '1 hr ago', unread: true },
  { id: 3, type: 'payment', message: 'Payment received – LKR 3,500 from Thunder FC', time: '2 hrs ago', unread: true },
];

const TypeIcon = ({ type }) => {
  if (type === 'booking') return <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5"><Calendar className="w-4 h-4" /></div>;
  if (type === 'cancel') return <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0 mt-0.5"><XCircle className="w-4 h-4" /></div>;
  return <div className="p-1.5 bg-green-50 text-green-600 rounded-lg shrink-0 mt-0.5"><CreditCard className="w-4 h-4" /></div>;
};

export default function OwnerHeader({ user, notifications = [], setNotifications, showNotifications, setShowNotifications, searchQuery, setSearchQuery, setActiveTab }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (n) => {
    setSelectedNotif(n);
    setNotifications(prev => (prev||[]).map(item => 
      (item.id === n.id || item._id === n._id) ? { ...item, read: true } : item
    ));
  };

  const unreadCount = (notifications||[]).filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      {selectedNotif && (
        <NotifDetailModal 
          notif={selectedNotif} 
          onClose={() => {
            if (selectedNotif.type === 'booking' && setActiveTab) setActiveTab('bookings');
            setSelectedNotif(null);
          }} 
        />
      )}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-black text-blue-600 italic tracking-tighter">FIND ME</span>
          </div>

          {/* Welcome message */}
          <div className="hidden md:block shrink-0 ml-3 pl-4 border-l border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Welcome back</p>
            <p className="text-gray-800 font-bold text-sm leading-tight">
              {user?.name} <span className="text-green-600">· {user?.indoor_name || 'My Indoor'}</span>
            </p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-blue-500 transition placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-blue-600"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-gray-800 font-bold text-sm">Notifications</span>
                    <div className="flex gap-3">
                      <button onClick={markAllRead} className="text-green-600 text-xs font-semibold hover:text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="p-8 text-center text-xs text-gray-400 italic">No recent activity</p>
                    )}
                    
                    {/* UNREAD STACK */}
                    {notifications.filter(n => !n.read).length > 0 && (
                      <div className="bg-blue-50/30">
                        <div className="px-4 py-2 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50/50 border-b border-blue-100/50">New For You</div>
                        {notifications.filter(n => !n.read).map(n => (
                          <button key={n.id || n._id} onClick={() => handleNotifClick(n)} className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-white transition border-l-4 border-blue-600">
                            <TypeIcon type={n.type || 'booking'} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-xs font-black leading-snug">{n.title || 'Notification'}</p>
                              <p className="text-gray-600 text-[11px] leading-snug mt-0.5">{n.message}</p>
                              <p className="text-blue-500 text-[9px] font-bold mt-1 uppercase tracking-tighter italic">Just now · New</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* READ STACK */}
                    {notifications.filter(n => n.read).length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50 border-b border-gray-100">Earlier</div>
                        {notifications.filter(n => n.read).map(n => (
                          <button key={n.id || n._id} onClick={() => handleNotifClick(n)} className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition opacity-60">
                            <TypeIcon type={n.type || 'booking'} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-700 text-xs font-bold leading-snug">{n.title || 'Notification'}</p>
                              <p className="text-gray-500 text-[11px] leading-snug mt-0.5">{n.message}</p>
                              <p className="text-gray-400 text-[9px] mt-1">
                                {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Viewed'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.[0] || 'O'}
                </div>
                <span className="text-gray-700 text-xs font-semibold hidden sm:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-gray-800 font-bold text-sm">{user?.name}</p>
                    <p className="text-gray-500 text-xs">{user?.email || 'owner@findme.lk'}</p>
                  </div>
                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm transition">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm transition">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 text-sm transition font-medium">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotifDetailModal({ notif, onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-zoomIn" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900 p-6 flex items-center justify-between">
          <h3 className="text-white font-black text-lg italic uppercase tracking-tight">Notification</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">✕</button>
        </div>
        <div className="p-7 space-y-4">
          <div className="flex items-center gap-3">
            <TypeIcon type={notif.type} />
            <p className="text-gray-900 text-lg font-black leading-tight">{notif.title || 'Notification'}</p>
          </div>
          <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
            "{notif.message}"
          </p>
          <div className="pt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
            <p className="text-xs font-bold text-gray-500 mt-1">
              {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
            </p>
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
            Okay, Got it
          </button>
        </div>
      </div>
    </div>
  );
}
