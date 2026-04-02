import { PlusCircle, CalendarDays, Users, FileText, RefreshCw, Info } from 'lucide-react';

const actions = [
  { icon: PlusCircle,   label: 'Add Booking',       color: 'text-green-700',  bg: 'bg-green-50 hover:bg-green-100 border-green-200' },
  { icon: CalendarDays, label: 'Update Availability', color: 'text-blue-700',   bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { icon: Users,        label: 'View All Players',  color: 'text-purple-700', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { icon: FileText,     label: 'Export Report',     color: 'text-yellow-700', bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
  { icon: RefreshCw,    label: 'Sync Data',         color: 'text-teal-700',   bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200' },
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
        if(setShowAddBooking) setShowAddBooking(true);
        break;
      case 'Update Availability':
        if(setActiveTab) setActiveTab('calendar');
        break;
      case 'View All Players':
        if(setActiveTab) setActiveTab('bookings');
        break;
      case 'Export Report':
        alert('Exporting PDF report... (Feature coming soon)');
        break;
      case 'Sync Data':
        if(fetchDashboardData && user) fetchDashboardData(user._id);
        break;
      default:
        break;
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition">
      <h3 className="text-gray-800 font-bold text-base mb-4 border-b border-gray-100 pb-3 mt-1">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map(({ icon: Icon, label, color, bg }) => (
          <button
            key={label}
            onClick={() => handleAction(label)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${bg}`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            <span className={`text-sm font-semibold ${color}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition group flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Info className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
        </div>
        <p className="text-gray-600 text-xs font-medium leading-relaxed">{tip}</p>
      </div>
    </section>
  );
}
