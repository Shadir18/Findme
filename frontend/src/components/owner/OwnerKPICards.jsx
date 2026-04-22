import { Calendar, TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

function KPICard({ icon: Icon, label, value, sub, iconColor, iconBg, trend }) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 hover:ring-indigo-500/50 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] transition-all duration-500 group flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-1000"></div>
      
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 ring-1 transition-all duration-500 shadow-lg group-hover:-rotate-6 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40">
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10 block">
        <p className="text-indigo-300 text-[11px] font-black uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-white text-3xl font-black tracking-tight leading-none mb-2">{value}</p>
        {sub && <p className="text-slate-400 text-xs font-semibold">{sub}</p>}
      </div>
    </div>
  );
}

export default function OwnerKPICards({ todayBookings, totalRevenueMonth, availableToday, courts, utilizationRate, upcomingBookings }) {
  const pendingCount = bookings => bookings.filter(b => b.status === 'Pending').length;
  const weekTeams = bookings => [...new Set(bookings.map(b => b.team))].length;

  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight">Today's Overview</h2>
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-indigo-300 text-sm font-black uppercase tracking-widest bg-indigo-500/20 ring-1 ring-indigo-500/40 px-4 py-2 rounded-xl">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard
          icon={Calendar}
          label="Today's Bookings"
          value={todayBookings?.length || 0}
          sub={`${pendingCount(todayBookings || [])} pending approval`}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20 ring-blue-500/40 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          trend="+2 vs yesterday"
        />
        <KPICard
          icon={DollarSign}
          label="Revenue This Month"
          value={`LKR ${(totalRevenueMonth / 1000).toFixed(1)}k`}
          sub="vs LKR 69k last month"
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20 ring-emerald-500/40 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          trend="+26.8%"
        />
        <KPICard
          icon={Zap}
          label="Available Slots"
          value={`${availableToday || 0}/${courts?.length || 0}`}
          sub="courts open now"
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20 ring-amber-500/40 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
        />
        <KPICard
          icon={Users}
          label="Upcoming Teams"
          value={weekTeams(upcomingBookings || [])}
          sub="teams this week"
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20 ring-purple-500/40 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
        />
        <KPICard
          icon={TrendingUp}
          label="Utilization Rate"
          value={`${utilizationRate || 0}%`}
          sub="courts booked this week"
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/20 ring-indigo-500/40 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
          trend="Peak: 6PM–9PM"
        />
      </div>
    </section>
  );
}
