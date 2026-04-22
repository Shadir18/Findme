import { useState } from 'react';
import { Download, ListFilter } from 'lucide-react';

const STATUS_STYLES = {
  Confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  Pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  Cancelled: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

export default function RecentBookings({ bookings, compact, onSelect }) {
  const [filter, setFilter] = useState('30');
  const todayStr = new Date().toISOString().split('T')[0];

  const cutoffDate = filter === '7'
    ? new Date(new Date(todayStr) - 7 * 86400000).toISOString().split('T')[0]
    : new Date(new Date(todayStr) - 30 * 86400000).toISOString().split('T')[0];

  const displayed = (bookings || [])
    .filter(b => b.date <= todayStr && b.date >= cutoffDate)
    .slice(0, compact ? 5 : undefined);

  return (
    <section className="bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
          {compact ? 'Recent Bookings' : 'Booking History'}
        </h3>
        {!compact && (
          <div className="flex items-center gap-3">
            <div className="flex bg-[#0A0F1C] rounded-[1rem] p-1 border border-white/10 shadow-inner">
              {['7', '30'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  Last {f} days
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-[1rem] border border-white/10 transition-all duration-300 hover:ring-1 hover:ring-indigo-500/50">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-white/[0.02] border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Sport</div>
        <div className="col-span-3">Team/Player</div>
        <div className="col-span-1 text-right">LKR</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {displayed.length === 0 && (
          <div className="text-slate-500 text-sm font-medium text-center py-10 italic">No bookings found in this range.</div>
        )}
        {displayed.map(b => (
          <div key={b.id} onClick={() => onSelect && onSelect(b)} className="grid grid-cols-12 gap-3 px-6 py-4 hover:bg-white/5 cursor-pointer transition-all duration-200 items-center group">
            <div className="col-span-2 text-slate-300 text-xs font-bold group-hover:text-indigo-300">{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div className="col-span-2 text-slate-400 text-xs group-hover:text-white transition-colors">{b.time.split(' - ')[0]}</div>
            <div className="col-span-2 text-slate-300 text-xs font-medium truncate">{b.sport}</div>
            <div className="col-span-3 text-white text-sm font-black truncate">{b.team}</div>
            <div className="col-span-1 text-slate-300 text-[11px] font-bold text-right">{(b.amount / 1000).toFixed(1)}k</div>
            <div className="col-span-2 text-right">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${STATUS_STYLES[b.status]}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
