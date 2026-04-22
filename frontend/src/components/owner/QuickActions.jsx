import { PlusCircle, CalendarDays, Users, FileText, RefreshCw, Info } from 'lucide-react';

const actions = [
  { icon: PlusCircle, label: 'Add Booking', color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 ring-1 ring-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' },
  { icon: CalendarDays, label: 'Update Availability', color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20 ring-1 ring-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' },
  { icon: Users, label: 'View All Players', color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20 ring-1 ring-purple-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' },
  { icon: FileText, label: 'Export Report', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20 ring-1 ring-amber-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' },
  { icon: RefreshCw, label: 'Sync Data', color: 'text-indigo-400', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 ring-1 ring-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' },
];

const tips = [
  'Enable weekend pricing to boost your revenue by up to 30%.',
  'Verified turfs get 2x more bookings. Upload your license today.',
  'Respond to bookings within 1 hour to improve your rating.',
];

export default function QuickActions({ setActiveTab, fetchDashboardData, user, setShowAddBooking }) {
  const tip = tips[Math.floor(Date.now() / 86400000) % tips.length];

  const handleAction = (label) => {
    switch (label) {
      case 'Add Booking':
        if (setShowAddBooking) setShowAddBooking(true);
        break;
      case 'Update Availability':
        if (setActiveTab) setActiveTab('calendar');
        break;
      case 'View All Players':
        if (setActiveTab) setActiveTab('bookings');
        break;
      case 'Export Report':
        alert('Exporting PDF report... (Feature coming soon)');
        break;
      case 'Sync Data':
        if (fetchDashboardData && user) fetchDashboardData(user._id);
        break;
      default:
        break;
    }
  };

  return (
    <section className="bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3"></div>
      
      <h3 className="text-white font-black text-lg mb-5 border-b border-white/10 pb-4 mt-1 tracking-tight">Quick Actions</h3>
      <div className="space-y-3 relative z-10">
        {actions.map(({ icon: Icon, label, color, bg }) => (
          <button
            key={label}
            onClick={() => handleAction(label)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 text-left hover:scale-[1.02] ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <span className={`text-sm font-bold tracking-wide ${color}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-6 p-5 bg-white/5 rounded-2xl ring-1 ring-white/10 hover:ring-indigo-500/50 transition duration-300 group flex flex-col gap-2 relative z-10">
        <div className="flex items-center gap-2 text-indigo-400">
          <Info className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">Pro Tip</span>
        </div>
        <p className="text-slate-300 text-sm font-medium leading-relaxed italic">"{tip}"</p>
      </div>
    </section>
  );
}
