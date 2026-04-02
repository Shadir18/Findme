import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Main colors matching Home Page
const COLORS = ['#10b981', '#3b82f6', '#facc15']; // Green, Blue, Yellow

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded shadow-lg px-3 py-2 text-sm z-50 relative">
        <p className="text-gray-500 text-xs mb-1 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color || '#10b981' }}>
            {prefix}{p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsSection({ analytics, bookings, compact }) {
  if (!analytics) return null;
  const { monthlyRevenue, peakHours, sportBreakdown } = analytics;

  // Calculate dynamic summaries from bookings
  let bestDay = 'N/A';
  let peakTimeStr = 'N/A';
  let topSport = 'N/A';
  let avgBookingStr = 'LKR 0';

  if (bookings && bookings.length > 0) {
    // Top Sport
    if (sportBreakdown && sportBreakdown.length > 0) {
      const top = sportBreakdown.reduce((prev, current) => (prev.count > current.count) ? prev : current);
      if (top && top.sport !== 'No Data') topSport = top.sport;
    }

    // Peak Time (Hour block)
    if (peakHours && peakHours.length > 0) {
      const peak = peakHours.reduce((prev, current) => (prev.bookings > current.bookings) ? prev : current);
      if (peak && peak.bookings > 0) peakTimeStr = peak.hour;
    }

    // Best Day of Week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = {};
    let sumAmount = 0;
    let successfulBookings = 0;

    bookings.forEach(b => {
      if (b.status === 'Cancelled') return;
      
      sumAmount += (parseFloat(b.amount) || 0);
      successfulBookings += 1;

      if (b.date) {
        const d = new Date(b.date);
        if (!isNaN(d)) {
          const dayName = days[d.getDay()];
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
      }
    });

    if (Object.keys(dayCounts).length > 0) {
      bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    }

    if (successfulBookings > 0 && sumAmount > 0) {
      avgBookingStr = `LKR ${Math.round(sumAmount / successfulBookings).toLocaleString()}`;
    }
  }

  if (compact) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <h3 className="text-gray-800 font-bold text-base">Revenue Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip prefix="LKR " />} />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#2563eb', r: 3, strokeWidth: 2, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <h2 className="text-gray-800 font-bold text-lg border-b border-gray-200 pb-2">Analytics & Insights</h2>

      {/* Revenue trend */}
      <div className="bg-white border border-gray-200 shadow-sm hover:shadow transition rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800 font-semibold text-sm tracking-wide">Monthly Revenue (LKR)</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip prefix="LKR " />} />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad2)" dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Peak hours */}
        <div className="bg-white border border-gray-200 shadow-sm hover:shadow transition rounded-xl p-5">
          <h3 className="text-gray-800 font-semibold text-sm mb-4 tracking-wide border-b border-gray-100 pb-2">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={peakHours} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" radius={[4, 4, 0, 0]} fill="#3b82f6" maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sport breakdown */}
        <div className="bg-white border border-gray-200 shadow-sm hover:shadow transition rounded-xl p-5">
          <h3 className="text-gray-800 font-semibold text-sm mb-4 tracking-wide border-b border-gray-100 pb-2">Most Booked Sports</h3>
          <div className="flex items-center gap-4 h-44">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={sportBreakdown} dataKey="count" nameKey="sport" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={2}>
                  {sportBreakdown.map((_, i) => (
                    <Cell key={i} fill={sportBreakdown[i].sport === 'No Data' ? '#e5e7eb' : COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {sportBreakdown.map((s, i) => (
                <div key={s.sport} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded shrink-0 shadow-sm" style={{ backgroundColor: s.sport === 'No Data' ? '#e5e7eb' : COLORS[i % COLORS.length] }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-bold truncate">{s.sport}</p>
                    <p className="text-gray-500 text-[10px] uppercase font-semibold">{s.count} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Best Day', value: bestDay, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'Peak Time', value: peakTimeStr, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'Top Sport', value: topSport, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'Avg/Booking', value: avgBookingStr, color: 'text-gray-800', bg: 'bg-white' },
        ].map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm hover:shadow transition group flex flex-col justify-center gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{item.label}</p>
            <p className={`font-bold text-base ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
