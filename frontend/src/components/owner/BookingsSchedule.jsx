import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Phone, ChevronRight, X } from 'lucide-react';

const STATUS_STYLES = {
  Confirmed: 'bg-green-50 text-green-700 border-green-200',
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const SPORT_DOT = {
  Futsal:          'bg-green-500',
  Badminton:       'bg-blue-500',
  'Indoor Cricket':'bg-yellow-500',
};

function BookingRow({ booking, onDetail }) {
  const safeTime = booking.time || '00:00 - 00:00';
  const timeSplit = safeTime.includes(' - ') ? safeTime.split(' - ') : [safeTime, ''];
  const safeAmount = booking.amount || 0;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition group">
      {/* Time */}
      <div className="w-20 shrink-0 text-center">
        <p className="text-gray-800 font-bold text-sm">{timeSplit[0]}</p>
        <p className="text-gray-500 text-[10px]">{timeSplit[1]}</p>
      </div>

      {/* Sport */}
      <div className="flex items-center gap-2 w-28 shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${SPORT_DOT[booking.sport] || 'bg-gray-400'}`}></div>
        <span className="text-gray-600 text-xs font-medium truncate">{booking.sport || 'Unknown'}</span>
      </div>

      {/* Team */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-semibold text-sm truncate">{booking.team || 'Unknown Player'}</p>
        <p className="text-gray-500 text-[10px]">{booking.players || 0} players · {booking.court || 'Any'}</p>
      </div>

      {/* Amount */}
      <div className="hidden sm:block w-24 text-right shrink-0">
        <p className="text-gray-700 font-semibold text-sm">LKR {safeAmount.toLocaleString()}</p>
      </div>

      {/* Status */}
      <div className="hidden md:block w-24 shrink-0">
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded border ${STATUS_STYLES[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onDetail(booking)} className="p-1.5 rounded bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-200 transition" title="View Details">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function DetailModal({ booking, onClose, onUpdateStatus }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
          <h3 className="text-gray-800 font-bold text-lg">Booking Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-0 divide-y divide-gray-100 mb-6">
          {[
            ['Team', booking.team],
            ['Sport', booking.sport],
            ['Date', booking.date],
            ['Time', booking.time],
            ['Court', booking.court],
            ['Players', booking.players],
            ['Phone', booking.user_phone || 'N/A'],
            ['Email', booking.user_email || 'N/A'],
            ['Amount', `LKR ${(booking.amount || 0).toLocaleString()}`],
            ['Status', booking.status],
          ].map(([label, val]) => (
            <div key={label} className={`flex justify-between items-center py-2.5 ${label === 'Phone' || label === 'Email' ? 'border-l-2 border-blue-500 pl-3 bg-blue-50/30' : ''}`}>
              <span className="text-gray-500 text-xs">{label}</span>
              <span className="text-gray-800 font-semibold text-sm text-right">{val}</span>
            </div>
          ))}
        </div>
        
        {booking.status === 'Pending' ? (
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdateStatus(booking.id, 'Confirmed')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-semibold text-sm transition shadow-sm">
              Confirm
            </button>
            <button 
              onClick={() => onUpdateStatus(booking.id, 'Cancelled')}
              className="flex-1 bg-white hover:bg-red-50 text-red-600 py-2.5 rounded font-semibold text-sm border border-red-200 transition">
              Decline
            </button>
          </div>
        ) : (
          <div className="mt-2 text-right">
            <span className="text-xs text-gray-500 font-semibold mb-2 block text-left">Update Status:</span>
            <select
              value={booking.status}
              onChange={(e) => onUpdateStatus(booking.id, e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-700 font-semibold rounded px-4 py-2 hover:bg-gray-50 transition"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsSchedule({ filteredBookings, bookingFilter, setBookingFilter, detailModal, setDetailModal, updateBookingStatus }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-800">
          Schedule
        </h2>
        <div className="flex bg-gray-50 rounded bg-gray-100 p-0.5 border border-gray-200">
          {['today', 'week', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setBookingFilter(f)}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                bookingFilter === f
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'week' ? 'This Week' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">No bookings found for this period.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredBookings.map(b => (
            <BookingRow key={b.id} booking={b} onDetail={setDetailModal} />
          ))}
        </div>
      )}

      {filteredBookings.length > 5 && (
        <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider transition">
          View All Bookings <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      <DetailModal booking={detailModal} onClose={() => setDetailModal(null)} onUpdateStatus={updateBookingStatus} />
    </section>
  );
}
