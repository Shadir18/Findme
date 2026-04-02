import { useState } from 'react';
import { Download, ListFilter } from 'lucide-react';

const STATUS_STYLES = {
  Confirmed: 'bg-green-50 text-green-700 border-green-200',
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function RecentBookings({ bookings, compact }) {
  const [filter, setFilter] = useState('30');
  const todayStr = new Date().toISOString().split('T')[0];

  const cutoffDate = filter === '7'
    ? new Date(new Date(todayStr) - 7 * 86400000).toISOString().split('T')[0]
    : new Date(new Date(todayStr) - 30 * 86400000).toISOString().split('T')[0];

  const displayed = (bookings || [])
    .filter(b => b.date <= todayStr && b.date >= cutoffDate)
    .slice(0, compact ? 5 : undefined);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow transition">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
          {compact ? 'Recent Bookings' : 'Booking History'}
        </h3>
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded p-0.5 border border-gray-200 shadow-sm">
              {['7', '30'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Last {f} days
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded border border-gray-200 hover:border-blue-200 shadow-sm transition">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Sport</div>
        <div className="col-span-3">Team/Player</div>
        <div className="col-span-1 text-right">LKR</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {displayed.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">No bookings found in this range.</div>
        )}
        {displayed.map(b => (
          <div key={b.id} className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-blue-50/50 transition items-center">
            <div className="col-span-2 text-gray-600 text-xs font-semibold">{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</div>
            <div className="col-span-2 text-gray-500 text-xs">{b.time.split(' - ')[0]}</div>
            <div className="col-span-2 text-gray-700 text-xs truncate">{b.sport}</div>
            <div className="col-span-3 text-gray-800 text-xs font-semibold truncate">{b.team}</div>
            <div className="col-span-1 text-gray-600 text-[11px] font-bold text-right">{(b.amount / 1000).toFixed(1)}k</div>
            <div className="col-span-2 text-right">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[b.status]}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
