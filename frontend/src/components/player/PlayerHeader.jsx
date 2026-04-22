import { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, User, Settings, X, Check, Calendar, CreditCard, XCircle, Sparkles, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TypeIcon = ({ type }) => {
  if (type === 'booking') return <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5 ring-1 ring-indigo-500/40"><Calendar className="w-4 h-4" /></div>;
  if (type === 'cancel') return <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5 ring-1 ring-rose-500/40"><XCircle className="w-4 h-4" /></div>;
  if (type === 'match') return <div className="p-1.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg shrink-0 mt-0.5 ring-1 ring-fuchsia-500/40"><Activity className="w-4 h-4" /></div>;
  return <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 ring-1 ring-emerald-500/40"><CreditCard className="w-4 h-4" /></div>;
};

export default function PlayerHeader({ user, notifications = [], onMarkRead, setTab }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const markAllRead = () => {
    notifications.forEach(n => { if (!n.read) onMarkRead(n._id); });
    setShowNotifications(false);
  };

  const handleNotifClick = (n) => {
    setSelectedNotif(n);
    if (!n.read) onMarkRead(n._id);
    setShowNotifications(false);
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <>
      {selectedNotif && (
        <NotifDetailModal
          notif={selectedNotif}
          onClose={() => {
            if (selectedNotif.type === 'booking' || selectedNotif.type === 'match') setTab('my-activity');
            setSelectedNotif(null);
          }}
        />
      )}
      <header className="bg-white/[0.02] backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* Logo (Visible on Mobile/Tablet) */}
            <div className="flex items-center gap-2 shrink-0 lg:hidden">
              <span className="text-2xl font-black text-white tracking-tighter">FIND ME</span>
            </div>

            {/* Welcome message */}
            <div className="hidden md:block lg:hidden shrink-0 ml-3 pl-4 border-l border-white/10">
              <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-0.5">Player Portal</p>
              <p className="text-white font-bold text-sm leading-none">
                {user?.name?.split(' ')[0]}
              </p>
            </div>

            <div className="flex items-center gap-4 ml-auto shrink-0">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className="relative p-2.5 rounded-full hover:bg-white/10 transition-all duration-300 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95 bg-white/5 ring-1 ring-white/10"
                >
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)] border-2 border-[#0A0F1C]"></span>
                  )}
                </button>

                {showNotifications && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 top-14 w-80 sm:w-96 bg-[#0A0F1C]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
                      <span className="text-white font-black text-base tracking-tight">Activity</span>
                      <div className="flex gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors bg-indigo-500/10 ring-1 ring-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[24rem] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3"><Sparkles className="w-6 h-6 text-slate-500"/></div>
                          <p className="text-white font-bold text-sm">You're all caught up!</p>
                          <p className="text-slate-500 text-xs mt-1">No new notifications right now.</p>
                        </div>
                      )}

                      {/* UNREAD STACK */}
                      {notifications.filter(n => !n.read).length > 0 && (
                        <div className="bg-indigo-500/5">
                          <div className="px-6 py-2.5 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">New For You</div>
                          {notifications.filter(n => !n.read).map(n => (
                            <button key={n.id || n._id} onClick={() => handleNotifClick(n)} className="w-full text-left px-6 py-5 flex gap-4 items-start hover:bg-white/5 transition-colors cursor-pointer group border-l-2 border-indigo-500">
                              <TypeIcon type={n.type || 'booking'} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-black tracking-tight leading-snug">{n.title || 'Notification'}</p>
                                <p className="text-slate-300 text-xs leading-relaxed mt-1 font-medium">{n.message}</p>
                                <p className="text-indigo-400 text-[10px] font-black mt-2 uppercase tracking-widest flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"/> New
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* READ STACK */}
                      {notifications.filter(n => n.read).length > 0 && (
                        <div>
                          <div className="px-6 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">Earlier</div>
                          {notifications.filter(n => n.read).map(n => (
                            <button key={n.id || n._id} onClick={() => handleNotifClick(n)} className="w-full text-left px-6 py-5 flex gap-4 items-start hover:bg-white/5 transition-colors cursor-pointer group opacity-70 hover:opacity-100">
                              <div className="p-1.5 bg-white/10 text-slate-400 rounded-lg shrink-0 mt-0.5 group-hover:text-white transition-colors">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-300 text-sm font-bold tracking-tight leading-snug">{n.title || 'Notification'}</p>
                                <p className="text-slate-500 text-xs leading-relaxed mt-1 font-medium">{n.message}</p>
                                <p className="text-slate-600 text-[9px] font-black mt-2 uppercase tracking-widest">
                                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Viewed'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>

              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-1.5 pr-4 transition-all shadow-sm group active:scale-95"
                >
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-900 font-black text-xs shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform">
                      {user?.name?.[0] || 'P'}
                    </div>
                  )}
                  <span className="text-white text-sm font-black tracking-tight hidden sm:block">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors hidden sm:block" />
                </button>

                {showProfile && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
                  <div className="absolute right-0 top-14 w-64 bg-[#0A0F1C]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                      <p className="text-white font-black text-lg tracking-tight mb-1">{user?.name}</p>
                      <p className="text-slate-400 text-xs font-bold">{user?.email || 'player@findme.lk'}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => { setTab('profile'); setShowProfile(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white text-sm font-bold rounded-xl transition-colors">
                        <User className="w-4 h-4 text-indigo-400" /> My Profile
                      </button>
                    </div>
                    <div className="p-2 border-t border-white/5 bg-white/[0.02]">
                      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 text-sm font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function NotifDetailModal({ notif, onClose }) {
  const iconMap = {
    booking: { icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/20', ring: 'ring-indigo-500/40', shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]' },
    cancel: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/20', ring: 'ring-rose-500/40', shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' },
    payment: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/40', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
    match: { icon: Activity, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', ring: 'ring-fuchsia-500/40', shadow: 'shadow-[0_0_20px_rgba(217,70,239,0.4)]' }
  };
  const theme = iconMap[notif.type] || iconMap.booking;

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 transform transition-all relative"
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-30 ${theme.bg}`}></div>
        
        <div className="bg-white/5 border-b border-white/10 p-8 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 ${theme.bg} rounded-2xl ring-1 ${theme.ring} ${theme.shadow}`}>
              <theme.icon className={`w-6 h-6 ${theme.color}`} />
            </div>
            <div>
              <h3 className="text-white font-black text-2xl tracking-tight leading-none mb-1 capitalize">{notif.type || 'Alert'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification Details</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/80 transition-all duration-300 active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 relative z-10">
          <div className="space-y-4">
            <h4 className="text-white font-black text-xl leading-tight">{notif.title || 'System Notification'}</h4>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative group">
              <div className={`absolute -left-px top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full transition-all duration-300 ${theme.bg.replace('/20', '')}`}></div>
              <p className="text-slate-300 font-semibold leading-relaxed text-sm">
                {notif.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Time Received</p>
              <p className="text-sm font-black text-white">
                {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Date</p>
              <p className="text-sm font-black text-white">
                {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Today'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-2 bg-transparent border-t border-white/5 flex gap-4 relative z-10">
          <button onClick={onClose} className="flex-1 py-4 bg-white hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
