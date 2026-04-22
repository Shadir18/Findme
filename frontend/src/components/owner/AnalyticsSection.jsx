import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { FileText, Download, Filter, Users, Clock, Calendar } from 'lucide-react';

// Main colors matching dark theme
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6']; // Emerald, Indigo, Amber, Purple

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0F1C]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl px-4 py-3 text-sm z-50 relative ring-1 ring-white/5">
        <p className="text-slate-400 text-xs mb-1.5 font-bold uppercase tracking-widest">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-black text-white" style={{ color: p.color || '#10b981' }}>
            {prefix}{p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsSection({ analytics, bookings, filteredBookings, compact }) {
  const [revenueFilter, setRevenueFilter] = useState('Weekly'); // Monthly, Weekly, Daily

  const dataToAnalyze = filteredBookings || bookings || [];

  // --- DERIVE DATA FROM BOOKINGS FOR FILTERING ---
  const filteredRevenueData = useMemo(() => {
    if (!dataToAnalyze) return [];
    const revenueMap = {};
    const now = new Date();

    dataToAnalyze.forEach(b => {
      if (b.status === 'Cancelled') return;
      const bDate = new Date(b.date);
      if (isNaN(bDate)) return;

      let key;
      if (revenueFilter === 'Daily') {
        // Last 14 days
        const diff = (now - bDate) / (1000 * 60 * 60 * 24);
        if (diff > 14) return;
        key = b.date;
      } else if (revenueFilter === 'Weekly') {
        // Last 12 weeks
        const diff = (now - bDate) / (1000 * 60 * 60 * 24 * 7);
        if (diff > 12) return;
        const weekNum = Math.ceil((bDate.getDate() + bDate.getDay()) / 7);
        key = `W${weekNum} ${bDate.toLocaleString('default', { month: 'short' })}`;
      } else {
        // Monthly
        key = bDate.toLocaleString('default', { month: 'short' });
      }
      revenueMap[key] = (revenueMap[key] || 0) + (parseFloat(b.amount) || 0);
    });

    if (revenueFilter === 'Monthly') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map(m => ({ label: m, revenue: revenueMap[m] || 0 })).filter(m => m.revenue > 0 || m.label === now.toLocaleString('default', { month: 'short' }));
    }

    return Object.entries(revenueMap)
      .map(([label, revenue]) => ({ label, revenue }))
      .sort((a, b) => new Date(a.label) - new Date(b.label));
  }, [dataToAnalyze, revenueFilter]);

  if (!analytics) return null;
  
  // Dynamic Peak hours & Sport Breakdown driven by active filters
  let peakHours = analytics.peakHours || [];
  let sportBreakdown = analytics.sportBreakdown || [];

  if (filteredBookings) {
     const sData = {};
     const pData = {};
     dataToAnalyze.forEach(b => {
         if (b.status === 'Cancelled') return;
         const sport = b.sport || 'Unknown';
         sData[sport] = (sData[sport] || 0) + 1;

         let time = b.time || b.timeSlot || '';
         const startHourMatch = time.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
         let hour = startHourMatch ? startHourMatch[0] : (time.split('-')[0].trim() || 'Unknown');
         pData[hour] = (pData[hour] || 0) + 1;
     });
     
     if (Object.keys(sData).length > 0) {
        sportBreakdown = Object.entries(sData).map(([sport, count]) => ({ sport, count }));
     }
     if (Object.keys(pData).length > 0) {
        peakHours = Object.entries(pData).map(([hour, bookings]) => ({ hour, bookings })).sort((a,b) => b.bookings - a.bookings).slice(0, 8);
     }
  }

  // Calculate dynamic summaries from filtered bookings
  let bestDay = 'N/A';
  let peakTimeStr = 'N/A';
  let topSport = 'N/A';
  let avgBookingStr = 'LKR 0';

  if (dataToAnalyze && dataToAnalyze.length > 0) {
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

    dataToAnalyze.forEach(b => {
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

  const exportToCSV = () => {
    if (!dataToAnalyze || dataToAnalyze.length === 0) return;
    const headers = ["Date", "Time", "Customer/Team", "Phone", "Email", "Court", "Sport", "Amount", "Status"];
    const rows = dataToAnalyze.map(b => [
      b.date,
      b.time || b.timeSlot,
      b.team || b.customerName,
      b.user_phone || b.phoneNumber,
      b.user_email || '',
      b.court || b.courtName,
      b.sport,
      b.amount,
      b.status
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Include filter scope in download name if possible
    link.setAttribute("download", `FindMe_Analytics_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (compact) {
    return (
      <section className="bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
        <div className="mb-5 border-b border-white/10 pb-4">
          <h3 className="text-white font-black text-lg tracking-tight">Revenue Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={filteredRevenueData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip prefix="LKR " />} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#revGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 2, stroke: '#030712' }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-white font-black text-3xl tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Financial performance & booking insights</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          Export Report (.CSV)
        </button>
      </div>

      {/* Revenue trend with Filters */}
      <div className="bg-white/[0.02] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/15 transition-all duration-700"></div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 relative z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/5 rounded-2xl ring-1 ring-white/10">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-white font-black text-base uppercase tracking-wider">Revenue Analysis</h3>
          </div>
          
          <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10">
            {['Daily', 'Weekly', 'Monthly'].map(f => (
              <button
                key={f}
                onClick={() => setRevenueFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  revenueFilter === f ? 'bg-white text-[#0A0F1C] shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300} className="relative z-10">
          <AreaChart data={filteredRevenueData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} dx={-10} />
            <Tooltip content={<CustomTooltip prefix="LKR " />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#6366f1" 
              strokeWidth={4} 
              fill="url(#revGrad2)" 
              dot={{ fill: '#6366f1', r: 5, strokeWidth: 3, stroke: '#030712' }} 
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Peak hours */}
        <div className="bg-white/[0.02] border border-white/10 shadow-lg rounded-[2.5rem] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Peak Usage Hours</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peakHours} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={5} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
              <Bar dataKey="bookings" radius={[8, 8, 0, 0]} fill="#6366f1" maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sport breakdown */}
        <div className="bg-white/[0.02] border border-white/10 shadow-lg rounded-[2.5rem] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Sport Popularity</h3>
          </div>
          <div className="flex items-center gap-10 h-48">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={sportBreakdown} dataKey="count" nameKey="sport" cx="50%" cy="50%" outerRadius={80} innerRadius={55} paddingAngle={6}>
                  {sportBreakdown.map((_, i) => (
                    <Cell key={i} fill={sportBreakdown[i].sport === 'No Data' ? '#1e293b' : COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-5 flex-1 pr-4">
              {sportBreakdown.map((s, i) => (
                <div key={s.sport} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-md shrink-0 transition-transform group-hover:scale-125 shadow-lg" style={{ backgroundColor: s.sport === 'No Data' ? '#1e293b' : COLORS[i % COLORS.length] }}></div>
                    <span className="text-slate-300 text-xs font-black truncate">{s.sport}</span>
                  </div>
                  <span className="text-white text-[11px] font-black">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Best Day', value: bestDay, color: 'text-emerald-400', icon: Calendar },
          { label: 'Peak Time', value: peakTimeStr, color: 'text-amber-400', icon: Clock },
          { label: 'Top Sport', value: topSport, color: 'text-indigo-400', icon: Users },
          { label: 'Avg/Booking', value: avgBookingStr, color: 'text-purple-400', icon: FileText },
        ].map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 text-center hover:bg-white/[0.08] hover:-translate-y-1.5 transition-all duration-300 group ring-1 ring-white/5 hover:ring-white/10 flex flex-col items-center gap-3">
            <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${item.color.replace('text-', 'bg-').replace('400', '400/10')}`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.label}</p>
              <p className={`font-black text-lg ${item.color} tracking-tight`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Booking Table (The Report Section) */}
      <div className="bg-[#0A0F1C]/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl mt-10">
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-white font-black text-base uppercase tracking-wider">Detailed Booking Report</h3>
          <span className="text-[10px] font-black text-indigo-400 border border-indigo-400/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {dataToAnalyze.length} Total Records
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {["Player / Team", "Court", "Sport", "Date & Time", "Amount", "Status"].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataToAnalyze && dataToAnalyze.length > 0 ? dataToAnalyze.map((b, i) => (
                <tr key={b.id || i} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{b.team || b.customerName || 'Manual Entry'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{b.user_phone || b.phoneNumber || 'No Contact'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">{b.court || b.courtName}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">{b.sport}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-white">{b.date}</p>
                    <p className="text-[10px] text-slate-400 font-black flex items-center gap-1.5 mt-1 uppercase">
                      <Clock className="w-3 h-3" /> {b.time || b.timeSlot}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-emerald-400">LKR {parseFloat(b.amount || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-xl border ${
                      b.status === 'Confirmed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                      b.status === 'Cancelled' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                      'text-amber-400 bg-amber-400/10 border-amber-400/20'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-500 italic font-medium">No booking data available for reports.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-white/[0.01] text-center border-t border-white/5">
          <p className="text-xs text-slate-500 font-bold italic">End of report — Automated data sync from Cloud Database</p>
        </div>
      </div>
    </section>
  );
}

