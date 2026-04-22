import { LayoutDashboard, Building2, CalendarDays, BookOpen, BarChart2 } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'turfs', label: 'My Turfs', Icon: Building2 },
  { id: 'bookings', label: 'Bookings', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2 },
];

export default function OwnerBottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1C]/90 backdrop-blur-2xl border-t border-white/10 lg:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.3)] pb-safe">
      <div className="flex items-stretch h-16 px-2">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === id
                ? 'text-indigo-400'
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === id ? 'bg-indigo-500/10' : 'bg-transparent'}`}>
              <Icon className={`w-5 h-5 transition-transform ${activeTab === id ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === id ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
            {activeTab === id && (
              <span className="absolute bottom-0 w-12 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
