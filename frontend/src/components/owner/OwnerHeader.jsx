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

export default function OwnerHeader({ user, notifications, setNotifications, showNotifications, setShowNotifications, searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [notifList, setNotifList] = useState(MOCK_NOTIFS);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, unread: false })));
    setNotifications(0);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                    {notifications}
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
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {notifList.map(n => (
                      <div key={n.id} className={`px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition ${n.unread ? '' : 'opacity-50'}`}>
                        <TypeIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-xs leading-snug">{n.message}</p>
                          <p className="text-gray-400 text-[10px] mt-1">{n.time}</p>
                        </div>
                        {n.unread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0"></div>}
                      </div>
                    ))}
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
