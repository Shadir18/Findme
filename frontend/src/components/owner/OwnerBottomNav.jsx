import { LayoutDashboard, Building2, CalendarDays, BookOpen, BarChart2 } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'turfs',     label: 'My Turfs',  Icon: Building2 },
  { id: 'bookings',  label: 'Bookings',  Icon: BookOpen },
  { id: 'calendar',  label: 'Calendar',  Icon: CalendarDays },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2 },
];

export default function OwnerBottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 lg:hidden shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
      <div className="flex items-stretch h-16">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${
              activeTab === id
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform ${activeTab === id ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            {activeTab === id && (
              <span className="absolute bottom-0 w-10 h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
