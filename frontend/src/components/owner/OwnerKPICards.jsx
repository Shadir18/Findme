import { Calendar, TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

function KPICard({ icon: Icon, label, value, sub, iconColor, iconBg, trend }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition group flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 mt-1">{label}</p>
        <p className="text-gray-800 text-2xl font-bold">{value}</p>
        {sub && <p className="text-gray-400 text-xs mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default function OwnerKPICards({ todayBookings, totalRevenueMonth, availableToday, courts, utilizationRate, upcomingBookings }) {
  const pendingCount = bookings => bookings.filter(b => b.status === 'Pending').length;
  const weekTeams = bookings => [...new Set(bookings.map(b => b.team))].length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Today's Overview</h2>
        <div className="flex-1 h-px bg-gray-200 mx-2"></div>
        <span className="text-gray-400 text-xs font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={Calendar}
          label="Today's Bookings"
          value={todayBookings?.length || 0}
          sub={`${pendingCount(todayBookings || [])} pending approval`}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 border border-blue-100"
          trend="+2 vs yesterday"
        />
        <KPICard
          icon={DollarSign}
          label="Revenue This Month"
          value={`LKR ${(totalRevenueMonth / 1000).toFixed(1)}k`}
          sub="vs LKR 69k last month"
          iconColor="text-green-600"
          iconBg="bg-green-50 border border-green-100"
          trend="+26.8%"
        />
        <KPICard
          icon={Zap}
          label="Available Slots"
          value={`${availableToday || 0}/${courts?.length || 0}`}
          sub="courts open now"
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50 border border-yellow-100"
        />
        <KPICard
          icon={Users}
          label="Upcoming Teams"
          value={weekTeams(upcomingBookings || [])}
          sub="teams this week"
          iconColor="text-purple-600"
          iconBg="bg-purple-50 border border-purple-100"
        />
        <KPICard
          icon={TrendingUp}
          label="Utilization Rate"
          value={`${utilizationRate || 0}%`}
          sub="courts booked this week"
          iconColor="text-teal-600"
          iconBg="bg-teal-50 border border-teal-100"
          trend="Peak: 6PM–9PM"
        />
      </div>
    </section>
  );
}
