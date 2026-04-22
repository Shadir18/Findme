import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trophy, MapPin, X, Check, Search, Calendar, ChevronDown, User, Activity, Map, Navigation, CheckCircle2, ChevronRight, Goal, Target, Sparkles, Clock, CreditCard, Users as UsersIcon, LogOut, MessageSquare } from 'lucide-react';
import PlayerProfile from '../components/player/PlayerProfile';
import PlayerHeader from '../components/player/PlayerHeader';


const API = 'http://127.0.0.1:5000';

const SL = {
  "Western": { "Colombo": ["Colombo 01-15", "Dehiwala", "Nugegoda", "Maharagama", "Battaramulla", "Moratuwa", "Homagama"], "Gampaha": ["Gampaha City", "Negombo", "Wattala", "Kelaniya", "Kiribathgoda", "Kadawatha", "Ja-Ela"], "Kalutara": ["Kalutara City", "Panadura", "Horana", "Beruwala", "Aluthgama"] },
  "Central": { "Kandy": ["Kandy City", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya"], "Matale": ["Matale City", "Dambulla", "Sigiriya"], "Nuwara Eliya": ["Nuwara Eliya Town", "Hatton", "Thalawakele"] },
  "Southern": { "Galle": ["Galle City", "Hikkaduwa", "Ambalangoda", "Elpitiya"], "Matara": ["Matara City", "Weligama", "Akuressa"], "Hambantota": ["Hambantota Town", "Tangalle", "Tissamaharama"] },
  "North Western": { "Kurunegala": ["Kurunegala City", "Kuliyapitiya", "Pannala", "Wariyapola"], "Puttalam": ["Puttalam Town", "Chilaw", "Wennappuwa", "Kalpitiya"] },
  "Sabaragamuwa": { "Ratnapura": ["Ratnapura City", "Pelmadulla", "Balangoda", "Embilipitiya"], "Kegalle": ["Kegalle Town", "Mawanella", "Warakapola"] },
  "Eastern": { "Trincomalee": ["Trincomalee City", "Kinniya", "Kantale"], "Batticaloa": ["Batticaloa City", "Kattankudy", "Valachchenai"], "Ampara": ["Ampara Town", "Kalmunai", "Arugam Bay"] },
  "Uva": { "Badulla": ["Badulla City", "Bandarawela", "Haputale", "Ella"], "Monaragala": ["Monaragala Town", "Wellawaya", "Kataragama"] },
  "North Central": { "Anuradhapura": ["Anuradhapura City", "Kekirawa", "Mihintale"], "Polonnaruwa": ["Polonnaruwa City", "Kaduruwela"] },
  "Northern": { "Jaffna": ["Jaffna City", "Nallur", "Chavakachcheri", "Point Pedro"], "Vavuniya": ["Vavuniya Town", "Nedunkeni"], "Mannar": ["Mannar Town", "Murunkan"] },
};
const SPORTS = ['Futsal', 'Football', 'Indoor Cricket', 'Badminton', 'Basketball', 'Tennis'];
const CAP = { Futsal: 10, Football: 10, 'Indoor Cricket': 12, Badminton: 4, Basketball: 10, Tennis: 4 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Shared atoms ───────────────────────────────────────────────────────────────
const lbl = 'block text-sm font-bold text-indigo-300 uppercase tracking-wide mb-2 ml-1';
const inp = 'w-full px-5 py-4 bg-[#0A0F1C]/80 border-2 border-white/10 hover:border-white/20 rounded-2xl text-base font-bold text-white placeholder-slate-400 focus:bg-[#0A0F1C] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-300 shadow-inner';
const sel = `${inp} appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-slate-900 [&>option]:text-white [&>option]:text-base`;

function SectionHeader({ title, right, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 mt-4 gap-4 group">
      <div className="flex items-center gap-4">
        {Icon && <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40"><Icon className="w-6 h-6" /></div>}
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{title}</h2>
          <div className="h-1.5 w-16 bg-indigo-500 rounded-full mt-2 transition-all duration-500 group-hover:w-32 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
        </div>
      </div>
      {right && <span className="text-white text-sm font-bold px-5 py-2.5 bg-white/10 ring-1 ring-white/20 rounded-full shadow-sm backdrop-blur-md self-start sm:self-auto">{right}</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    open: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/40',
    confirmed: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
    fully_paid: 'bg-purple-500/20 text-purple-300 ring-purple-500/40',
    Pending: 'bg-amber-500/20 text-amber-300 ring-amber-500/40',
    Confirmed: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
    Cancelled: 'bg-rose-500/20 text-rose-300 ring-rose-500/40'
  };
  const c = map[status] || 'bg-white/10 text-slate-200 ring-white/30';
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-full ring-1 backdrop-blur-sm uppercase tracking-wide ${c}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]"></span>
      {status?.replace('_', ' ')}
    </span>
  );
}

function ProgressBar({ count, capacity }) {
  const pct = Math.min((count / capacity) * 100, 100);
  const full = count >= capacity;
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-indigo-300" />
          <span className="text-sm font-bold text-white tracking-wide">{count} of {capacity}</span>
        </div>
        <span className={`text-sm font-black uppercase tracking-wider transition-colors ${full ? 'text-emerald-400' : 'text-indigo-400'}`}>{full ? 'Roster Full' : `${capacity - count} Spots Open`}</span>
      </div>
      <div className="h-3.5 bg-white/10 rounded-full overflow-hidden p-1 shadow-inner ring-1 ring-white/5">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${full ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`} style={{ width: `${pct}%` }}>
          <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

// ── Location Cascade ───────────────────────────────────────────────────────────
function LocationCascade({ value, onChange }) {
  const [dynamicTowns, setDynamicTowns] = useState([]);

  useEffect(() => {
    if (value.district) {
      fetch(`${API}/api/turfs?district=${encodeURIComponent(value.district)}`)
        .then(r => r.json())
        .then(data => {
          const turfs = data.turfs || [];
          const customTowns = turfs.map(t => t.address?.town).filter(Boolean);
          setDynamicTowns([...new Set(customTowns)]);
        })
        .catch(() => setDynamicTowns([]));
    } else {
      setDynamicTowns([]);
    }
  }, [value.district]);

  const provinces = Object.keys(SL);
  const districts = value.province ? Object.keys(SL[value.province]) : [];
  const staticTowns = value.province && value.district ? SL[value.province][value.district] || [] : [];
  const towns = [...new Set([...staticTowns, ...dynamicTowns])].sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="group">
        <label className={lbl}>Province</label>
        <div className="relative">
          <select className={sel} value={value.province || ''} onChange={e => onChange({ province: e.target.value, district: '', town: '' })}>
            <option value="">Select Province</option>
            {provinces.map(p => <option key={p}>{p}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
      <div className="group">
        <label className={lbl}>District</label>
        <div className="relative">
          <select className={sel} disabled={!value.province} value={value.district || ''} onChange={e => onChange({ ...value, district: e.target.value, town: '' })}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
      <div className="group">
        <label className={lbl}>Town</label>
        <div className="relative">
          <select className={sel} disabled={!value.district} value={value.town || ''} onChange={e => onChange({ ...value, town: e.target.value })}>
            <option value="">Select Town</option>
            {towns.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ── Payment Modal (match group) ────────────────────────────────────────────────
function PayModal({ group, playerId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ card_number: '', card_name: '', expiry: '', cvv: '' });
  const [err, setErr] = useState('');
  const amt = group ? Math.round(3500 / Math.max(group.player_count || 1, 1)) : 0;

  const fmt = (v, f) => {
    if (f === 'card_number') return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (f === 'expiry') return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
    if (f === 'cvv') return v.replace(/\D/g, '').slice(0, 3);
    return v;
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.card_number || !form.card_name || !form.expiry || !form.cvv) { setErr('All fields are required.'); return; }
    setErr(''); setStep(2);
    try {
      const r = await fetch(`${API}/api/matches/${group._id}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId, ...form }) });
      if (r.ok) { setStep(3); setTimeout(onSuccess, 2000); } else { const d = await r.json(); setErr(d.error || 'Payment failed. Please try again.'); setStep(1); }
    } catch { setErr('Network error. Check your connection.'); setStep(1); }
  };

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0F1C] border-2 border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 relative overflow-hidden bg-white/5 border-b border-white/10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-[60px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/30 rounded-full blur-[60px]"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-6 h-6 text-indigo-400" />
                <span className="text-indigo-400 text-sm font-black tracking-widest uppercase">Secure Checkout</span>
              </div>
              <h3 className="text-white font-black text-4xl tracking-tight leading-none mb-2">Confirm Slot</h3>
              <p className="text-slate-300 text-base font-medium">{group?.sport} in {group?.area}</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {step === 1 && (
            <form onSubmit={submit} className="space-y-8">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 ring-1 ring-white/20 mb-4">
                <div>
                  <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1.5">Total Due</p>
                  <p className="text-white text-5xl font-black tracking-tighter">LKR {amt.toLocaleString()}</p>
                </div>
              </div>

              {err && <div className="flex items-center gap-3 text-rose-300 text-sm bg-rose-500/20 ring-1 ring-rose-500/50 rounded-xl p-5 font-bold animate-in slide-in-from-top-2"><X className="w-5 h-5" />{err}</div>}

              <div className="space-y-5">
                <div>
                  <label className={lbl}>Card Number</label>
                  <input className={inp + ' font-mono tracking-widest text-xl'} placeholder="0000 0000 0000 0000" value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: fmt(e.target.value, 'card_number') }))} />
                </div>
                <div>
                  <label className={lbl}>Name on Card</label>
                  <input className={inp} placeholder="J. DOE" value={form.card_name} onChange={e => setForm(f => ({ ...f, card_name: e.target.value.toUpperCase() }))} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Expiry</label>
                    <input className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="MM/YY" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: fmt(e.target.value, 'expiry') }))} />
                  </div>
                  <div>
                    <label className={lbl}>CVV</label>
                    <input type="password" className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="•••" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: fmt(e.target.value, 'cvv') }))} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-5 rounded-2xl font-bold text-base text-slate-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-white hover:bg-indigo-50 text-slate-900 rounded-2xl font-black text-base shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                  Pay LKR {amt.toLocaleString()}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}
          {step === 2 && <div className="text-center py-20"><div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mx-auto mb-8" /><p className="text-white text-2xl font-black tracking-tight">Processing Payment</p><p className="text-slate-400 text-base mt-3 font-medium">Please do not close this window.</p></div>}
          {step === 3 && <div className="text-center py-20 animate-in zoom-in duration-500"><div className="w-28 h-28 rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"><Check className="w-14 h-14 text-emerald-400" /></div><p className="text-white font-black text-4xl tracking-tight">Payment Complete!</p><p className="text-slate-300 text-base mt-4 font-medium">Your spot on the field is officially confirmed.</p></div>}
        </div>
      </div>
    </div>
  );
}

// ── Invite Payment Modal (Processing Fee) ──────────────────────────────────────
function InvitePayModal({ reqId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ card_number: '', card_name: '', expiry: '', cvv: '' });
  const [err, setErr] = useState('');
  const amt = 100; // Fixed processing fee

  const fmt = (v, f) => {
    if (f === 'card_number') return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (f === 'expiry') return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
    if (f === 'cvv') return v.replace(/\D/g, '').slice(0, 3);
    return v;
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.card_number || !form.card_name || !form.expiry || !form.cvv) { setErr('All fields are required.'); return; }
    setErr(''); setStep(2);
    // Simulate payment delay for processing fee
    setTimeout(() => {
      setStep(3);
      setTimeout(onSuccess, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0F1C] border-2 border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 relative overflow-hidden bg-white/5 border-b border-white/10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-[60px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/20 rounded-full blur-[60px]"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-6 h-6 text-amber-400" />
                <span className="text-amber-400 text-sm font-black tracking-widest uppercase">Processing Fee</span>
              </div>
              <h3 className="text-white font-black text-4xl tracking-tight leading-none mb-2">Join Fee</h3>
              <p className="text-slate-300 text-sm font-medium">A tiny fee is required to officially confirm your slot on the squad.</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {step === 1 && (
            <form onSubmit={submit} className="space-y-8">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 ring-1 ring-white/20 mb-4">
                <div>
                  <p className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1.5">Processing Fee</p>
                  <p className="text-white text-5xl font-black tracking-tighter">LKR {amt}</p>
                </div>
              </div>

              {err && <div className="flex items-center gap-3 text-rose-300 text-sm bg-rose-500/20 ring-1 ring-rose-500/50 rounded-xl p-5 font-bold"><X className="w-5 h-5" />{err}</div>}

              <div className="space-y-5">
                <div>
                  <label className={lbl}>Card Number</label>
                  <input className={inp + ' font-mono tracking-widest text-xl'} placeholder="0000 0000 0000 0000" value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: fmt(e.target.value, 'card_number') }))} />
                </div>
                <div>
                  <label className={lbl}>Name on Card</label>
                  <input className={inp} placeholder="J. DOE" value={form.card_name} onChange={e => setForm(f => ({ ...f, card_name: e.target.value.toUpperCase() }))} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Expiry</label>
                    <input className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="MM/YY" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: fmt(e.target.value, 'expiry') }))} />
                  </div>
                  <div>
                    <label className={lbl}>CVV</label>
                    <input type="password" className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="•••" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: fmt(e.target.value, 'cvv') }))} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-5 rounded-2xl font-bold text-base text-slate-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                  Pay LKR {amt} to Join
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}
          {step === 2 && <div className="text-center py-20"><div className="w-16 h-16 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin mx-auto mb-8" /><p className="text-white text-2xl font-black tracking-tight">Processing Payment</p></div>}
          {step === 3 && <div className="text-center py-20 animate-in zoom-in duration-500"><div className="w-28 h-28 rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"><Check className="w-14 h-14 text-emerald-400" /></div><p className="text-white font-black text-4xl tracking-tight">Fee Paid!</p><p className="text-slate-300 text-base mt-4 font-medium">Adding you to the squad...</p></div>}
        </div>
      </div>
    </div>
  );
}

// ── Booking Modal (court slot) ─────────────────────────────────────────────────
function BookingModal({ turf, court, playerId, onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState([]);
  const [loadingBusy, setLB] = useState(false);
  const [step, setStep] = useState(1);
  const [card, setCard] = useState({ card_number: '', card_name: '', expiry: '', cvv: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (date && court?._id) {
      setLB(true);
      fetch(`${API}/api/courts/${court._id}/busy-slots?date=${date}`)
        .then(r => r.json())
        .then(d => setBusy(d.busy || []))
        .catch(() => setBusy([]))
        .finally(() => setLB(false));
      setSlot('');
    }
  }, [date, court?._id]);

  let startHour = parseInt((turf?.timing?.open || '06:00').split(':')[0], 10);
  let endHour = parseInt((turf?.timing?.close || '23:00').split(':')[0], 10);

  if (endHour === 0) endHour = 24;
  if (endHour <= startHour) {
    if (endHour < 12) endHour += 12;
    if (endHour <= startHour) endHour += 12;
  }

  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    let startH = h % 24;
    let endH = (h + 1) % 24;
    slots.push(`${String(startH).padStart(2, '0')}:00 - ${String(endH).padStart(2, '0')}:00`);
  }
  const rate = Number(turf?.pricing?.weekday?.day || turf?.pricing?.standard || 1500);

  const fmt = (v, f) => {
    if (f === 'card_number') return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (f === 'expiry') return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
    if (f === 'cvv') return v.replace(/\D/g, '').slice(0, 3);
    return v;
  };

  const handlePay = async e => {
    e.preventDefault();
    if (!card.card_number || !card.card_name || !card.expiry || !card.cvv) { setErr('All card details are required.'); return; }
    if (busy.includes(slot)) { setErr('This slot was just taken. Please pick another.'); return; }

    setErr('');
    try {
      const r = await fetch(`${API}/api/player/book`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId, owner_id: turf._id, court_id: court._id, court_name: court.name, sport: court.sport, date, time_slot: slot, amount: rate, indoor_name: turf.indoor_name }) });
      if (r.ok) { setStep(3); setTimeout(onSuccess, 2000); } else { const d = await r.json(); setErr(d.error || 'Booking failed. Please try again.'); }
    } catch { setErr('Network error. Check connection.'); }
  };

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0F1C] border-2 border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-8 sm:p-10 relative shrink-0 overflow-hidden bg-white/5 border-b border-white/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/30 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-indigo-400" />
                <span className="text-indigo-400 text-sm font-black tracking-widest uppercase">Court Booking</span>
              </div>
              <h3 className="text-white font-black text-4xl tracking-tight leading-none mb-3">{turf?.indoor_name}</h3>
              <p className="text-slate-300 text-lg font-medium">{court?.name} • {court?.sport}</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 hover:rotate-90 transition-all duration-300"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-8 sm:p-10">
          {step === 1 && (
            <div className="space-y-8">
              {err && <div className="flex items-center gap-3 text-rose-300 text-sm bg-rose-500/20 ring-1 ring-rose-500/50 rounded-xl p-5 font-bold"><X className="w-5 h-5" />{err}</div>}

              <div>
                <label className={lbl}>Choose Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} className={inp} value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div className={`${!date && 'opacity-50 pointer-events-none transition-opacity'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 ml-1 gap-2">
                  <label className="text-sm font-black text-indigo-300 uppercase tracking-wide">Select Time Slot</label>
                  {loadingBusy && <span className="text-xs font-bold text-indigo-300 animate-pulse bg-indigo-500/20 px-4 py-1.5 rounded-full ring-1 ring-indigo-500/40">Syncing availability...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[18rem] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                  {slots.map(t => {
                    const isBusy = busy.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSlot(t)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl ring-1 transition-all duration-200 ${isBusy ? 'bg-white/5 ring-white/5 text-slate-500 cursor-not-allowed' :
                            slot === t ? 'bg-indigo-600 ring-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] transform scale-105 z-10' :
                              'bg-white/5 ring-white/20 text-slate-200 hover:ring-indigo-400 hover:bg-indigo-500/20 hover:-translate-y-1 hover:shadow-lg'
                          }`}
                      >
                        <span className="font-bold text-base tracking-tight flex items-center gap-2">
                          {isBusy && <X className="w-4 h-4" />}
                          {t.replace(/(^| - )0/g, '$1')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Total</p>
                  <span className="text-white font-black text-4xl tracking-tighter">LKR {rate.toLocaleString()}</span>
                </div>
                <button onClick={() => { if (!date || !slot) { setErr('Please select a date and slot.'); return; } setErr(''); setStep(2); }} className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-base shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                  Continue to Pay
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handlePay} className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-500/40 gap-4">
                <div>
                  <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Booking Details</p>
                  <p className="text-white font-bold text-lg">{date} • {slot}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Total</p>
                  <p className="text-white text-4xl font-black tracking-tighter">LKR {rate.toLocaleString()}</p>
                </div>
              </div>

              {err && <div className="flex items-center gap-3 text-rose-300 text-sm bg-rose-500/20 ring-1 ring-rose-500/50 rounded-xl p-5 font-bold"><X className="w-5 h-5" />{err}</div>}

              <div className="space-y-5">
                <div><label className={lbl}>Card Number</label><input className={inp + ' font-mono tracking-widest text-xl'} placeholder="0000 0000 0000 0000" value={card.card_number} onChange={e => setCard(f => ({ ...f, card_number: fmt(e.target.value, 'card_number') }))} /></div>
                <div><label className={lbl}>Name on Card</label><input className={inp} placeholder="J. DOE" value={card.card_name} onChange={e => setCard(f => ({ ...f, card_name: e.target.value.toUpperCase() }))} /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className={lbl}>Expiry</label><input className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="MM/YY" value={card.expiry} onChange={e => setCard(f => ({ ...f, expiry: fmt(e.target.value, 'expiry') }))} /></div>
                  <div><label className={lbl}>CVV</label><input type="password" className={inp + ' font-mono text-center tracking-widest text-lg'} placeholder="•••" value={card.cvv} onChange={e => setCard(f => ({ ...f, cvv: fmt(e.target.value, 'cvv') }))} /></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="button" onClick={() => { setStep(1); setErr(''); }} className="w-full sm:w-auto px-8 py-5 rounded-2xl font-bold text-base text-slate-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10 transition-colors">Back</button>
                <button type="submit" className="flex-1 py-5 bg-white hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-base shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Confirm Booking
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && <div className="text-center py-20 animate-in zoom-in duration-500"><div className="w-28 h-28 rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"><Check className="w-14 h-14 text-emerald-400" /></div><p className="text-white font-black text-4xl tracking-tight">Booking Confirmed!</p><p className="text-slate-300 text-base mt-4 font-medium">Your request has been sent to the facility. You can track the status in the Activity tab.</p></div>}
        </div>
      </div>
    </div>
  );
}

const formatTimeSlots = (timeStr) => {
  if (!timeStr || timeStr === 'Anytime') return timeStr;
  const slots = timeStr.split(',').map(s => s.trim());
  if (slots.length <= 1) return timeStr;

  const parseTime = (t) => {
    if (!t) return 0;
    const parts = t.split(' ');
    if (parts.length < 2) return 0;
    let [h, m] = parts[0].split(':').map(Number);
    if (parts[1] === 'PM' && h !== 12) h += 12;
    if (parts[1] === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  let parsed = slots.map(s => {
    const parts = s.split(' - ');
    if (parts.length !== 2) return null;
    return { startStr: parts[0], endStr: parts[1], startMin: parseTime(parts[0]), endMin: parseTime(parts[1]) };
  }).filter(Boolean);

  if (parsed.length === 0) return timeStr;
  parsed.sort((a, b) => a.startMin - b.startMin);

  let merged = [];
  let current = parsed[0];

  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i].startMin <= current.endMin) {
      if (parsed[i].endMin > current.endMin) {
        current.endMin = parsed[i].endMin;
        current.endStr = parsed[i].endStr;
      }
    } else {
      merged.push(current);
      current = parsed[i];
    }
  }
  merged.push(current);

  return merged.map(m => `${m.startStr} - ${m.endStr}`).join(', ');
};

// ── Team Modal ─────────────────────────────────────────────────────────────────
function TeamModal({ group, onClose }) {
  const cap = CAP[group?.sport] || 10;
  const empty = cap - (group?.player_count || 0);
  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0F1C] border-2 border-white/10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-6 bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/30 rounded-full blur-[60px]"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-white font-black text-4xl tracking-tight leading-none mb-3">{group?.sport} Squad</h3>
              <p className="text-indigo-300 text-sm font-bold tracking-wider uppercase flex items-center gap-2 mb-1"><MapPin className="w-4 h-4" /> {group?.area}</p>
              {group?.preferred_time && group?.preferred_time !== "Anytime" && (
                <p className="text-emerald-400 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 mt-2 bg-emerald-500/10 w-max px-3 py-1.5 rounded-lg ring-1 ring-emerald-500/30">
                  <Clock className="w-3.5 h-3.5" /> {formatTimeSlots(group?.preferred_time)}
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 transition-colors"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <StatusBadge status={group?.status} />
          <span className="text-sm font-black text-slate-300 uppercase tracking-wider">{group?.player_count} / {cap} Filled</span>
        </div>

        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {(group?.players || []).map((p, i) => (
            <div key={p.player_id} className="flex items-center gap-5 bg-white/5 ring-1 ring-white/10 shadow-sm rounded-2xl p-5 transition-all hover:ring-indigo-500/60 hover:bg-indigo-500/10 group">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(99,102,241,0.6)] group-hover:scale-105 transition-transform">{(p.name || 'P')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-lg font-bold truncate leading-tight">{p.name}</p>
                <p className="text-indigo-200 text-sm font-semibold mt-1">Player {i + 1}</p>
              </div>
              {p.paid && <span className="text-xs font-black tracking-wider text-emerald-300 bg-emerald-500/20 ring-1 ring-emerald-500/40 rounded-xl px-4 py-2 uppercase">Paid</span>}
            </div>
          ))}
          {[...Array(Math.max(empty, 0))].map((_, i) => (
            <div key={i} className="flex items-center gap-5 bg-white/[0.02] ring-1 ring-white/5 border border-dashed border-white/20 rounded-2xl p-5 opacity-60">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 bg-white/5"><User className="w-6 h-6" /></div>
              <div className="flex-1">
                <div className="h-3 w-32 bg-white/10 rounded-full mb-3"></div>
                <div className="h-2.5 w-20 bg-white/5 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Group Chat Modal (also handles direct request chats) ──────────────────────────────
function GroupChatModal({ group, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useCallback(node => { if (node) node.scrollIntoView({ behavior: 'smooth' }); }, []);

  // Support two modes:
  //   1. Squad group chat  → group._id is a match_group id  (apiPath = /api/matches/<id>/chat)
  //   2. Direct request chat → group.requestId is a join_request id (apiPath = /api/requests/<id>/chat)
  const chatPath = group.requestId
    ? `${API}/api/requests/${group.requestId}/chat`
    : `${API}/api/matches/${group._id}/chat`;

  const fetchChats = useCallback(() => {
    fetch(chatPath)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [chatPath]);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const send = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    const txt = msg;
    setMsg('');
    try {
      await fetch(chatPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user._id, name: user.name, message: txt })
      });
      fetchChats();
    } catch {}
  };

  const title = group.requestId ? `Chat with ${group.captainName || 'Captain'}` : 'Squad Chat';
  const subtitle = group.requestId
    ? `${group.sport || ''} in ${group.area || ''} — Pre-match chat`
    : `${group?.sport} in ${group?.area}`;

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0F1C] border-2 border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 relative overflow-hidden bg-white/5 border-b border-white/10 shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-white font-black text-2xl tracking-tight leading-none mb-1">{title}</h3>
              <p className="text-slate-300 text-sm font-medium">{subtitle}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500/80 transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0F1C] flex flex-col custom-scrollbar gap-4">
          {loading ? (
             <div className="text-indigo-400 text-center uppercase tracking-widest text-xs font-bold animate-pulse m-auto">Loading...</div>
          ) : messages.length === 0 ? (
             <div className="text-slate-500 text-center m-auto text-sm font-bold tracking-widest uppercase">No messages yet. Say hi! 👋</div>
          ) : (
            messages.map(m => {
              const isMe = m.player_id === user._id;
              return (
                <div key={m._id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1 ml-1">{isMe ? 'You' : m.name}</span>
                  <div className={`px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/10 text-slate-200 ring-1 ring-white/10 rounded-tl-sm'}`}>
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={send} className="p-4 bg-white/5 border-t border-white/10 shrink-0 flex gap-3 items-center relative z-10">
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500" />
          <button type="submit" disabled={!msg.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
            <MessageSquare className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Match Card ─────────────────────────────────────────────────────────────────
function MatchCard({ group, playerId, onJoin, onPay, onTeam, onChat, onLeave, mine }) {
  const cap = CAP[group.sport] || 10;
  const inGroup = (group.players || []).some(p => p.player_id === playerId);
  const myEntry = (group.players || []).find(p => p.player_id === playerId);
  const full = (group.player_count || 0) >= cap;
  const sportIcons = { Futsal: <Activity className="w-8 h-8" />, Football: <Target className="w-8 h-8" />, 'Indoor Cricket': <Trophy className="w-8 h-8" />, Badminton: <Navigation className="w-8 h-8" />, Basketball: <Goal className="w-8 h-8" />, Tennis: <CheckCircle2 className="w-8 h-8" /> };

  return (
    <div className="bg-white/[0.04] backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all duration-500 group hover:-translate-y-1.5 relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-indigo-500/30 to-transparent rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-1000"></div>

      <div className="relative z-10 flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-500/20 ring-1 ring-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg group-hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] group-hover:-rotate-6">{sportIcons[group.sport] || <Trophy className="w-8 h-8" />}</div>
          <div>
            <p className="text-white font-black text-2xl tracking-tight leading-none mb-2">{group.sport}</p>
            <p className="text-slate-300 text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> {group.area}</p>
            {group.preferred_date && (
              <p className="text-indigo-300 text-xs font-bold mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {group.preferred_date}
                {group.preferred_time && <span className="text-slate-400"> • {formatTimeSlots(group.preferred_time)}</span>}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={group.status} />
      </div>

      <div className="relative z-10 mb-8 bg-white/5 p-6 rounded-2xl ring-1 ring-white/10 backdrop-blur-sm">
        <ProgressBar count={group.player_count || 0} capacity={cap} />
      </div>

      <div className="relative z-10 flex gap-4 flex-wrap border-t border-white/10 pt-6 mt-auto">
        <button onClick={() => onTeam(group)} className="flex-1 min-w-[120px] px-5 py-4 text-sm font-bold text-white hover:bg-white/10 bg-white/5 ring-1 ring-white/20 rounded-2xl transition-all shadow-sm active:scale-95 text-center">View Squad</button>
        {!mine && !inGroup && !full && <button onClick={() => onJoin(group._id)} className="flex-1 min-w-[120px] px-5 py-4 bg-white hover:bg-slate-200 text-slate-900 text-sm font-black rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] text-center">Join Game</button>}
        {inGroup && group.status === 'confirmed' && !myEntry?.paid && <button onClick={() => onPay(group)} className="flex-1 min-w-[120px] px-5 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all active:scale-[0.98] text-center">Pay Share</button>}
        {inGroup && myEntry?.paid && <button onClick={() => onChat && onChat(group)} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-4 text-sm font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] rounded-2xl transition-all active:scale-95"><MessageSquare className="w-5 h-5" /> Squad Chat</button>}
        {inGroup && group.status === 'open' && <div className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-4 text-sm font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 ring-1 ring-indigo-500/40 rounded-2xl"><div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]" /> In Queue</div>}
        {mine && inGroup && group.status !== 'fully_paid' && <button onClick={() => onLeave && onLeave(group._id)} className="flex-1 min-w-[120px] px-5 py-4 text-sm font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 ring-1 ring-rose-500/20 rounded-2xl transition-all shadow-sm active:scale-95 text-center">Leave Game</button>}
      </div>
    </div>
  );
}

// ── Tab: Preferences ───────────────────────────────────────────────────────────
function PreferencesTab({ user, onSaved }) {
  const [prefs, setPrefs] = useState({
    sport: '',
    locType: 'default',
    loc: { province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' },
    date: new Date().toISOString().split('T')[0],
    timeSlots: [],
    isTeam: false
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const sportIcons = { Futsal: <Activity className="w-8 h-8" />, Football: <Target className="w-8 h-8" />, 'Indoor Cricket': <Trophy className="w-8 h-8" />, Badminton: <Navigation className="w-8 h-8" />, Basketball: <Goal className="w-8 h-8" />, Tennis: <CheckCircle2 className="w-8 h-8" /> };

  const [availSports, setAvailSports] = useState([]);
  const [loadingSports, setLS] = useState(false);

  const timeBlocks = [
    '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'
  ];

  useEffect(() => {
    const finalLoc = prefs.locType === 'custom' ? prefs.loc : { province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' };
    if (!finalLoc.district) { setAvailSports([]); setPrefs(p => ({ ...p, sport: '' })); return; }
    
    const fetchSports = async () => {
      setLS(true);
      try {
        const p = new URLSearchParams({ district: finalLoc.district });
        if (finalLoc.province) p.append('province', finalLoc.province);
        if (finalLoc.town) p.append('town', finalLoc.town);
        const r = await fetch(`${API}/api/turfs?${p}`);
        const d = await r.json();
        const sports = [...new Set((d.turfs || []).flatMap(t => t.courts.map(c => c.sport)))].sort();
        setAvailSports(sports);
        if (sports.length > 0 && !sports.includes(prefs.sport)) {
           setPrefs(p => ({ ...p, sport: '' })); // clear sport if unavailable locally
        }
      } catch { setAvailSports([]); }
      setLS(false);
    };
    fetchSports();
  }, [prefs.locType, prefs.loc.district, prefs.loc.town, user]);

  const save = async () => {
    const finalLoc = prefs.locType === 'custom' ? prefs.loc : { province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' };
    
    if (!finalLoc.district) { 
      setMsg({ ok: false, text: prefs.locType === 'default' ? 'Your profile has no default location. Please choose a custom location.' : 'Please select at least a District.' }); 
      return; 
    }
    if (!prefs.sport) { setMsg({ ok: false, text: 'Please select a sport.' }); return; }
    if (!prefs.date) { setMsg({ ok: false, text: 'Please select a date.' }); return; }
    if (prefs.timeSlots.length === 0) { setMsg({ ok: false, text: 'Please select at least one preferred time.' }); return; }

    setSaving(true); setMsg(null);
    try {
      const area = finalLoc.town || finalLoc.district;
      const r = await fetch(`${API}/api/player/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: user._id,
          sport: prefs.sport,
          area,
          province: finalLoc.province,
          district: finalLoc.district,
          town: finalLoc.town,
          preferred_days: [prefs.date],
          preferred_time: prefs.timeSlots.join(', '),
          is_team: prefs.isTeam
        })
      });
      if (r.ok) { setMsg({ ok: true, text: 'Preferences saved! Finding your match…' }); setTimeout(onSaved, 1200); }
      else { const d = await r.json(); setMsg({ ok: false, text: d.error || 'Error saving.' }); }
    } catch { setMsg({ ok: false, text: 'Cannot reach server.' }); }
    setSaving(false);
  };

  const toggleSlot = (t) => {
    setPrefs(p => ({
      ...p,
      timeSlots: p.timeSlots.includes(t) ? p.timeSlots.filter(x => x !== t) : [...p.timeSlots, t]
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      <SectionHeader title="Match Preferences" right="AI Matched" icon={Sparkles} />

      {/* 0. Account Mode Selection */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mb-2">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-1/2">
          <label className={`${lbl} mb-2`}>0. Setup Profile Mode</label>
          <p className="text-slate-400 text-xs leading-relaxed">Are you looking to join a game as a free agent, or do you have a full squad actively seeking an opponent?</p>
        </div>
        <div className="relative z-10 flex gap-2 w-full md:w-auto mt-2 md:mt-0 p-1.5 bg-white/5 rounded-2xl ring-1 ring-white/10">
          <button onClick={() => setPrefs(p => ({ ...p, isTeam: false }))} className={`flex-1 md:flex-none px-6 py-3.5 rounded-[1.1rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${!prefs.isTeam ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>👤 Individual Player</button>
          <button onClick={() => setPrefs(p => ({ ...p, isTeam: true }))} className={`flex-1 md:flex-none px-6 py-3.5 rounded-[1.1rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${prefs.isTeam ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>🛡️ Full Squad</button>
        </div>
      </div>

      {/* 1. Location */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 w-full">
          <label className={lbl}>1. Location</label>
          {prefs.locType === 'default' ? (
            <div className="mt-3 p-5 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="text-white font-bold text-base">{user?.address?.town || user?.address?.district || 'Not Set'}</p>
                <p className="text-indigo-300 uppercase tracking-widest font-black text-[10px] mt-1">Default Profile Location</p>
              </div>
            </div>
          ) : (
            <div className="mt-4"><LocationCascade value={prefs.loc} onChange={loc => setPrefs(p => ({ ...p, loc }))} /></div>
          )}
        </div>

        <div className="shrink-0 md:mt-8 w-full md:w-auto">
          <button onClick={() => setPrefs(p => ({ ...p, locType: p.locType === 'default' ? 'custom' : 'default' }))} className="w-full md:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl ring-1 ring-white/20 transition-all">
            {prefs.locType === 'default' ? 'Change Location' : 'Use Default Location'}
          </button>
        </div>
      </div>

      {/* 2. Select Sport */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-5">
          <label className={`${lbl} mb-0`}>2. Select Available Sport</label>
          {prefs.sport && (
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl ring-1 ring-white/20 mt-3 md:mt-0 shadow-sm">
              <UsersIcon className="w-4 h-4 text-indigo-300" />
              <p className="text-[10px] text-indigo-100 font-bold tracking-widest uppercase">
                {prefs.sport === 'Badminton' || prefs.sport === 'Tennis' ? '2 or 4' : prefs.sport === 'Indoor Cricket' ? '12' : CAP[prefs.sport]} players required
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10">
          {loadingSports ? (
            <div className="flex items-center gap-4 py-6 text-indigo-300">
              <div className="w-6 h-6 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="text-xs font-black tracking-widest uppercase">Scanning Area...</span>
            </div>
          ) : availSports.length === 0 ? (
            <div className="py-8 text-center bg-white/5 rounded-2xl ring-1 ring-white/10">
              <X className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm">No sports available in this location.</p>
              <p className="text-slate-500 text-xs mt-1">Try selecting a different district or town.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {availSports.map(s => (
                <button key={s} onClick={() => setPrefs(p => ({ ...p, sport: s }))} className={`group relative flex flex-col items-center gap-3 py-5 px-2 rounded-2xl ring-1 transition-all duration-300 overflow-hidden ${prefs.sport === s ? 'ring-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] transform scale-105' : 'ring-white/10 bg-white/5 hover:bg-white/10 hover:ring-white/30 hover:shadow-xl'}`}>
                  {prefs.sport === s && <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 to-transparent"></div>}
                  <span className={`relative z-10 p-3 rounded-2xl transition-all duration-300 ${prefs.sport === s ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10 text-slate-300 group-hover:text-indigo-300 group-hover:bg-indigo-500/20'}`}>{sportIcons[s] || <Trophy className="w-5 h-5"/>}</span>
                  <span className={`relative z-10 text-[11px] font-black uppercase tracking-wider text-center leading-none ${prefs.sport === s ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Date & Time Selection */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10">
        <label className={`${lbl} mb-6`}>3. When do you want to play?</label>

        <div className="mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Date</p>
          <input type="date" min={new Date().toISOString().split('T')[0]} className={`${inp} sm:max-w-xs`} value={prefs.date} onChange={e => setPrefs(p => ({ ...p, date: e.target.value }))} />
        </div>

        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Time Slots (Select Multiple)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 max-h-[16rem] overflow-y-auto pr-2 custom-scrollbar">
            {timeBlocks.map(t => (
              <button key={t} onClick={() => toggleSlot(t)} className={`py-3.5 rounded-xl text-xs font-black tracking-tight transition-all ring-1 ${prefs.timeSlots.includes(t) ? 'ring-indigo-500 bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transform scale-[1.02]' : 'ring-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {t.replace(/(^| - )0/g, '$1')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg && <div className={`p-5 rounded-2xl text-sm font-bold ring-1 flex items-center gap-3 animate-in slide-in-from-bottom-2 ${msg.ok ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40 shadow-sm' : 'bg-rose-500/20 text-rose-300 ring-rose-500/40 shadow-sm'}`}>{msg.ok ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}{msg.text}</div>}

      <div className="pt-2">
        <button onClick={save} disabled={saving} className="w-full py-5 bg-white hover:bg-slate-200 disabled:opacity-70 text-slate-900 rounded-2xl font-black text-base shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group">
          {saving ? <div className="w-5 h-5 border-4 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : <><Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Set Preferences & Find Match</>}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Find Matches (Find Players / Free Agents) ───────────────────────────
function FindMatchesTab({ user }) {
  const [loc, setLoc] = useState({ province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' });
  const [lookingFor, setLookingFor] = useState('players');
  const [locType, setLocType] = useState('default');
  const [availSports, setAvailSports] = useState([]);
  const [loadingSports, setLS] = useState(false);
  const [fSport, setFS] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({});

  const timeBlocks = [
    '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'
  ];

  const toggleSlot = (t) => {
    setTimeSlots(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleLocType = () => {
    if (locType === 'default') {
      setLocType('custom');
    } else {
      setLocType('default');
      setLoc({ province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' });
    }
  };

  useEffect(() => {
    if (!loc.district) { setAvailSports([]); setFS(''); setPlayers([]); setSearched(false); return; }
    const fetchSports = async () => {
      setLS(true); setFS(''); setPlayers([]); setSearched(false);
      try {
        const p = new URLSearchParams({ district: loc.district });
        if (loc.province) p.append('province', loc.province);
        if (loc.town) p.append('town', loc.town);
        const r = await fetch(`${API}/api/turfs?${p}`);
        const d = await r.json();
        const sports = [...new Set((d.turfs || []).flatMap(t => t.courts.map(c => c.sport)))].sort();
        setAvailSports(sports);
      } catch { setAvailSports([]); }
      setLS(false);
    };
    fetchSports();
  }, [loc.district, loc.town]);

  const searchPlayers = useCallback(async () => {
    if (!loc.district || !fSport) return;
    setLoading(true); setSearched(true);
    try {
      const p = new URLSearchParams();
      p.append('district', loc.district);
      if (loc.town) p.append('town', loc.town);
      p.append('sport', fSport);
      p.append('is_team', lookingFor === 'teams' ? 'true' : 'false');

      const r = await fetch(`${API}/api/players/available?${p}`);
      const d = await r.json();

      let matchingPlayers = (d.players || []).filter(p => p.player_id !== user._id);

      if (date || timeSlots.length > 0) {
        matchingPlayers = matchingPlayers.filter(p => {
          let matchDate = true;
          if (date && p.preferred_days && p.preferred_days.length > 0) {
            matchDate = p.preferred_days.includes(date);
          }
          let matchTime = true;
          if (timeSlots.length > 0 && p.preferred_time) {
            if (p.preferred_time !== 'Anytime') {
              const pTimes = p.preferred_time.split(',').map(s => s.trim());
              matchTime = timeSlots.some(t => pTimes.includes(t));
            }
          }
          return matchDate && matchTime;
        });
      }

      setPlayers(matchingPlayers);
    } catch { setPlayers([]); }
    setLoading(false);
  }, [loc.district, loc.town, fSport, user._id, date, timeSlots, lookingFor]);

  const invitePlayer = async (pid) => {
    setInviteStatus(s => ({ ...s, [pid]: 'Sending...' }));
    try {
      const r = await fetch(`${API}/api/players/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_player_id: user._id, to_player_id: pid, sport: fSport, area: loc.town || loc.district || 'your area', type: lookingFor === 'teams' ? 'challenge' : 'invite' })
      });
      if (r.ok) setInviteStatus(s => ({ ...s, [pid]: 'Request Sent' }));
      else setInviteStatus(s => ({ ...s, [pid]: 'Failed' }));
    } catch { setInviteStatus(s => ({ ...s, [pid]: 'Error' })); }
  };

  const sportIcons = { Futsal: <Activity className="w-8 h-8" />, Football: <Target className="w-8 h-8" />, 'Indoor Cricket': <Trophy className="w-8 h-8" />, Badminton: <Navigation className="w-8 h-8" />, Basketball: <Goal className="w-8 h-8" />, Tennis: <CheckCircle2 className="w-8 h-8" /> };

  return (
    <div className="space-y-5 animate-in fade-in duration-700 pb-8">
      <SectionHeader title={lookingFor === 'players' ? "Find Free Agents" : "Find Opponent Teams"} right={searched ? `${players.length} Found` : 'Scout Network'} icon={Search} />

      <div className="bg-white/5 p-1.5 rounded-[1.5rem] ring-1 ring-white/10 flex gap-2 max-w-sm w-full mb-2">
        <button onClick={() => { setLookingFor('players'); setSearched(false); setPlayers([]); }} className={`flex-1 py-4 rounded-[1.2rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${lookingFor === 'players' ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.4)] transform scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>🔍 Scout Players</button>
        <button onClick={() => { setLookingFor('teams'); setSearched(false); setPlayers([]); }} className={`flex-1 py-4 rounded-[1.2rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${lookingFor === 'teams' ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.4)] transform scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>⚔️ Challenge Squads</button>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 w-full">
          <label className={lbl}>1. Search Location</label>
          <p className="text-slate-400 text-xs mb-4 ml-1">The sports available below will automatically update to show <strong className="text-white">only what is physically available</strong> in this region.</p>
          {locType === 'default' ? (
            <div className="p-5 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="text-white font-bold text-base">{user?.address?.town || user?.address?.district || 'Not Set'}</p>
                <p className="text-indigo-300 uppercase tracking-widest font-black text-[10px] mt-1">Default Profile Location</p>
              </div>
            </div>
          ) : (
            <div className="mt-2"><LocationCascade value={loc} onChange={l => { setLoc(l); }} /></div>
          )}
          {!loc.district && locType === 'custom' && (
            <div className="mt-5 p-5 bg-indigo-500/20 ring-1 ring-indigo-500/40 rounded-2xl flex items-center gap-4 animate-in fade-in">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.6)]"><Map className="w-6 h-6 text-white" /></div>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">Select a <strong className="font-black text-white">District</strong> to discover available players near you.</p>
            </div>
          )}
        </div>

        <div className="shrink-0 md:mt-11 w-full md:w-auto">
          <button onClick={toggleLocType} className="w-full md:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl ring-1 ring-white/20 transition-all">
            {locType === 'default' ? 'Change Location' : 'Use Default Location'}
          </button>
        </div>
      </div>

      {loc.district && (
        <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-5">
            <label className={`${lbl} mb-0`}>2. Select Target Sport</label>
            {loadingSports && <span className="mt-4 md:mt-0 text-[10px] font-black uppercase tracking-widest text-indigo-300 animate-pulse bg-indigo-500/20 px-4 py-2 rounded-full ring-1 ring-indigo-500/40">Scanning venues...</span>}
          </div>

          {loadingSports ? (
            <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
              {[...Array(5)].map((_, i) => <div key={i} className="h-32 w-28 shrink-0 bg-white/10 rounded-2xl animate-[pulse_1.5s_ease-in-out_infinite]" />)}
            </div>
          ) : availSports.length === 0 ? (
            <div className="bg-white/5 ring-1 ring-white/10 rounded-[1.5rem] p-10 text-center relative z-10">
              <div className="w-20 h-20 bg-white/5 shadow-inner ring-1 ring-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5"><Target className="w-8 h-8 text-slate-500" /></div>
              <p className="text-white text-xl font-black tracking-tight">No registered sports found here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 relative z-10">
              {availSports.map(s => (
                <button key={s} onClick={() => setFS(s)} className={`group flex flex-col items-center gap-3 py-5 px-2 rounded-2xl ring-1 transition-all duration-300 ${fSport === s ? 'ring-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)] transform scale-105' : 'ring-white/10 bg-white/5 hover:bg-white/10 hover:ring-white/30'}`}>
                  <span className={`p-3 rounded-2xl transition-colors ${fSport === s ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10 text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/20'}`}>{sportIcons[s] ? <div className="scale-75">{sportIcons[s]}</div> : <Trophy className="w-6 h-6" />}</span>
                  <span className={`text-[11px] font-black uppercase tracking-wider text-center leading-tight ${fSport === s ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {fSport && (
        <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 animate-in slide-in-from-bottom-4 duration-500">
          <label className={`${lbl} mb-6`}>3. When do you need players?</label>

          <div className="mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Date</p>
            <input type="date" min={new Date().toISOString().split('T')[0]} className={`${inp} sm:max-w-xs`} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="mb-8">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Time Slots (Select Multiple)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 max-h-[16rem] overflow-y-auto pr-2 custom-scrollbar">
              {timeBlocks.map(t => (
                <button key={t} onClick={() => toggleSlot(t)} className={`py-3.5 rounded-xl text-xs font-black tracking-tight transition-all ring-1 ${timeSlots.includes(t) ? 'ring-indigo-500 bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transform scale-[1.02]' : 'ring-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                  {t.replace(/(^| - )0/g, '$1')}
                </button>
              ))}
            </div>
          </div>

          <button onClick={searchPlayers} disabled={loading || !date || timeSlots.length === 0} className="w-full py-5 bg-white hover:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-slate-900 rounded-2xl font-black text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            {loading ? <><div className="w-5 h-5 border-[3px] border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Searching</> : <><Search className="w-5 h-5" /> Search Available Players</>}
          </button>
        </div>
      )}

      {searched && !loading && players.length === 0 && (
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] shadow-sm ring-1 ring-white/10 py-16 text-center animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-white/5 ring-1 ring-white/10 rounded-full flex items-center justify-center mx-auto mb-5"><UsersIcon className="w-8 h-8 text-slate-400" /></div>
          <p className="text-white text-xl font-black tracking-tight mb-2">No {lookingFor === 'players' ? 'free agents' : 'opposing squads'} found.</p>
          <p className="text-slate-400 text-sm">No one is currently available for {fSport} at this specific time and area.</p>
        </div>
      )}

      {players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both mt-6">
          {players.map(p => (
            <div key={p.player_id} className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:ring-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300 group">
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500">{(p.name || 'P')[0].toUpperCase()}</div>
                <div className="min-w-0">
                  <h4 className="text-white font-black text-xl tracking-tight leading-tight truncate">{p.name}</h4>
                  <p className="text-slate-300 text-sm font-semibold mt-1.5 flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {p.sport} • {p.area}</p>
                  <div className="mt-3">
                    <span className="bg-indigo-500/20 ring-1 ring-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 truncate max-w-full"><Clock className="w-3 h-3 shrink-0" /> Match Found!</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => invitePlayer(p.player_id)}
                disabled={!!inviteStatus[p.player_id]}
                className={`w-full sm:w-auto px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shrink-0 ${inviteStatus[p.player_id] ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 cursor-default shadow-none' : 'bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
              >
                {inviteStatus[p.player_id] === 'Request Sent' && <Check className="w-4 h-4" />}
                {inviteStatus[p.player_id] || (lookingFor === 'teams' ? 'Send Challenge' : 'Send Request')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Book Indoor ───────────────────────────────────────────────────────────
function BookIndoorTab({ user, onDone }) {
  const [loc, setLoc] = useState({ province: user?.address?.province || '', district: user?.address?.district || '', town: user?.address?.town || '' });
  const [sport, setSport] = useState('');
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookTarget, setBook] = useState(null);

  const search = useCallback(async () => {
    if (!loc.district) { return; }
    setLoading(true); setSearched(true);
    try { const p = new URLSearchParams({ district: loc.district }); if (loc.province) p.append('province', loc.province); if (loc.town) p.append('town', loc.town); if (sport) p.append('sport', sport); const r = await fetch(`${API}/api/turfs?${p}`); const d = await r.json(); setTurfs(d.turfs || []); } catch { setTurfs([]); }
    setLoading(false);
  }, [loc.district, loc.province, loc.town, sport]);

  useEffect(() => { if (loc.district) search(); }, [search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <SectionHeader title="Book Facilities" right="Reserve a Court" icon={Map} />

      {/* Compact Search Header */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          <LocationCascade value={loc} onChange={setLoc} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            <div className="sm:col-span-2 group">
              <label className={lbl}>Filter by Sport (Optional)</label>
              <div className="relative">
                <select className={sel} value={sport} onChange={e => setSport(e.target.value)}><option value="">Any Sport</option>{SPORTS.map(s => <option key={s}>{s}</option>)}</select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
            <button onClick={search} disabled={loading} className="w-full py-4 bg-white hover:bg-slate-200 disabled:opacity-70 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
              {loading ? <><div className="w-5 h-5 border-[3px] border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Loading</> : <><Search className="w-5 h-5 group-hover:scale-110 transition-transform" /> Search</>}
            </button>
          </div>
        </div>
      </div>

      {searched && !loading && turfs.length === 0 && (
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl shadow-sm ring-1 ring-white/10 py-16 text-center animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Map className="w-8 h-8 text-slate-500" /></div>
          <p className="text-white text-xl font-black tracking-tight mb-2">No facilities found.</p>
          <p className="text-slate-400 text-sm">Try expanding your search area or clearing the sport filter.</p>
        </div>
      )}

      <div className="space-y-6 mt-6 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        {turfs.map(turf => (
          <div key={turf._id} className="bg-white/[0.03] backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/10 overflow-hidden transition-all duration-300 group">
            <div className="flex flex-col md:flex-row items-stretch gap-0">

              {/* Compact Image Sidebar */}
              <div className="relative w-full md:w-64 shrink-0 h-48 md:h-auto overflow-hidden">
                {turf.turf_image ? <img src={turf.turf_image} alt={turf.indoor_name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl"><Trophy className="w-12 h-12 text-slate-600" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent md:hidden"></div>
                <div className="absolute bottom-4 left-5 md:hidden">
                  <h4 className="text-white font-black text-2xl tracking-tight mb-1">{turf.indoor_name}</h4>
                  <p className="text-slate-300 text-xs font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {[turf.address?.town, turf.address?.district].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              {/* Dense Data Section */}
              <div className="p-5 md:p-6 lg:p-8 flex-1 min-w-0 bg-transparent flex flex-col">

                {/* Header Row (Desktop) */}
                <div className="hidden md:flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h4 className="text-white font-black text-2xl tracking-tight mb-1.5">{turf.indoor_name}</h4>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> {[turf.address?.town, turf.address?.district, turf.address?.province].filter(Boolean).join(', ')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {turf.phone && <span className="bg-white/5 ring-1 ring-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5">📞 {turf.phone}</span>}
                    <span className="bg-indigo-500/10 ring-1 ring-indigo-500/30 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-indigo-300 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {turf.timing?.open || '06:00'} – {turf.timing?.close || '23:00'}</span>
                  </div>
                </div>

                {/* Badges Row (Mobile only - Desktop uses the above right-aligned layout) */}
                <div className="flex md:hidden flex-wrap gap-2 mb-5">
                  {turf.phone && <span className="bg-white/5 ring-1 ring-white/10 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white inline-flex items-center gap-1.5">📞 {turf.phone}</span>}
                  <span className="bg-indigo-500/10 ring-1 ring-indigo-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-indigo-300 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {turf.timing?.open || '06:00'} – {turf.timing?.close || '23:00'}</span>
                </div>

                {/* Compact Court Rows */}
                <div className="mt-auto space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2">Available Courts</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {turf.courts.map(court => (
                      <div key={court._id} className="flex items-center justify-between bg-white/5 hover:bg-indigo-500/10 ring-1 ring-white/10 hover:ring-indigo-500/40 rounded-2xl p-3 transition-colors duration-200">

                        {/* Left: Icon & Name */}
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-indigo-500/40"><CheckCircle2 className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm tracking-tight truncate">{court.name}</p>
                            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5 truncate">{court.sport}</p>
                          </div>
                        </div>

                        {/* Right: Price & Button */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-white font-black text-sm">LKR {Number(turf.pricing?.weekday?.day || turf.pricing?.standard || 1500).toLocaleString()}</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Per Hour</p>
                          </div>
                          <button onClick={() => setBook({ turf, court })} className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-900 text-xs font-black rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.15)] active:scale-95 transition-all">
                            Book
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookTarget && <BookingModal turf={bookTarget.turf} court={bookTarget.court} playerId={user._id} onClose={() => setBook(null)} onSuccess={() => { setBook(null); onDone(); }} />}
    </div>
  );
}

// ── Tab: Chats ─────────────────────────────────────────────────────────────────
const statusColor = {
  pending:  'bg-amber-500/20 text-amber-300 ring-amber-500/40',
  accepted: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
  declined: 'bg-rose-500/20 text-rose-300 ring-rose-500/40',
  withdrawn:'bg-white/5 text-slate-400 ring-white/10',
};

function ChatsTab({ user, onChat }) {
  const [squadGroups, setSquadGroups] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [gRes, rRes, sRes] = await Promise.all([
          fetch(`${API}/api/player/matches/${user._id}`).then(r => r.json()),
          fetch(`${API}/api/players/requests?player_id=${user._id}`).then(r => r.json()),
          fetch(`${API}/api/players/sent-requests?player_id=${user._id}`).then(r => r.json()),
        ]);
        const chatGroups = (gRes.groups || []).filter(g => {
          if (['cancelled','completed','expired'].includes(g.status)) return false;
          const myEntry = (g.players || []).find(p => p.player_id === user._id);
          return myEntry?.paid || g.created_by === user._id;
        });
        setSquadGroups(chatGroups);
        setReceived(rRes.requests || []);
        setSent(sRes.requests || []);
      } catch {}
      setLoading(false);
    };
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, [user._id]);

  const allEmpty = !loading && squadGroups.length === 0 && received.length === 0 && sent.length === 0;

  const RequestRow = ({ req, isSent }) => {
    const otherName = isSent ? (req.to_name || 'Player') : req.from_name;
    const statusKey = (req.status || 'pending').replace('d','').toLowerCase();
    const badgeClass = statusColor[req.status] || statusColor.pending;
    return (
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/5 transition-colors group">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
          {(otherName || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-0.5 flex-wrap">
            <h4 className="text-white font-black text-base truncate">{otherName}</h4>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ring-1 ${badgeClass}`}>{req.status || 'pending'}</span>
            {isSent && <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded-md ring-1 ring-white/10">Sent by you</span>}
          </div>
          <p className="text-slate-400 text-xs font-medium truncate">{req.sport} · {req.area}</p>
        </div>
        <button
          onClick={() => onChat({
            requestId: req._id,
            captainName: isSent ? (req.to_name || 'Player') : req.from_name,
            sport: req.sport,
            area: req.area
          })}
          className="shrink-0 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 ring-1 ring-indigo-500/40 rounded-xl transition-all flex items-center gap-2 active:scale-95"
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-8">
      <SectionHeader title="My Chats" icon={MessageSquare} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 ring-1 ring-white/10 rounded-2xl animate-pulse" />)}
        </div>
      ) : allEmpty ? (
        <div className="bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 rounded-[2rem] py-24 text-center">
          <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <p className="text-white font-black text-xl mb-1">No chats yet</p>
          <p className="text-slate-400 text-sm">Send a request or join a squad to start chatting.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Squad Group Chats ── */}
          {squadGroups.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Squad Chats</p>
              <div className="bg-white/[0.04] backdrop-blur-2xl ring-1 ring-white/10 rounded-[2rem] divide-y divide-white/5 overflow-hidden">
                {squadGroups.map(g => (
                  <button key={g._id} onClick={() => onChat(g)} className="w-full text-left p-5 sm:p-6 hover:bg-white/5 transition-all flex items-center gap-4 sm:gap-5 group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl font-black">
                      {g.sport[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-base truncate">{g.sport} Squad</h4>
                      <p className="text-slate-400 text-xs font-medium truncate">{g.area} · {g.preferred_date || 'Ongoing'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Received Requests ── */}
          {received.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Received Invites</p>
              <div className="bg-white/[0.04] backdrop-blur-2xl ring-1 ring-white/10 rounded-[2rem] divide-y divide-white/5 overflow-hidden">
                {received.map(req => <RequestRow key={req._id} req={req} isSent={false} />)}
              </div>
            </div>
          )}

          {/* ── Sent Requests ── */}
          {sent.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Sent Requests</p>
              <div className="bg-white/[0.04] backdrop-blur-2xl ring-1 ring-white/10 rounded-[2rem] divide-y divide-white/5 overflow-hidden">
                {sent.map(req => <RequestRow key={req._id} req={req} isSent={true} />)}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Tab: My Activity ───────────────────────────────────────────────────────────
function MyActivityTab({ user, onPay, onTeam, onChat, refreshKey, onRefresh }) {
  const [groups, setGroups] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('requests');
  const [actionState, setActionState] = useState({});
  const [payForRequest, setPayForRequest] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [gr, bk, rq] = await Promise.all([
        fetch(`${API}/api/player/matches/${user._id}`).then(r => r.json()),
        fetch(`${API}/api/player/bookings/${user._id}`).then(r => r.json()),
        fetch(`${API}/api/players/requests?player_id=${user._id}`).then(r => r.json()),
      ]);
      setGroups(gr.groups || []);
      setBookings(bk.bookings || []);
      setRequests(rq.requests || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user._id, refreshKey]);

  const respond = async (reqId, action) => {
    setActionState(s => ({ ...s, [reqId]: action === 'accept' ? 'Accepting…' : 'Declining…' }));
    try {
      const r = await fetch(`${API}/api/players/requests/${reqId}/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user._id, action })
      });
      if (r.ok) {
        setActionState(s => ({ ...s, [reqId]: action === 'accept' ? 'Accepted ✓' : 'Declined' }));
        setTimeout(() => {
          setRequests(prev => prev.filter(x => x._id !== reqId));
          if (onRefresh) onRefresh();
        }, 1200);
      }
    } catch {
      setActionState(s => ({ ...s, [reqId]: 'Error' }));
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setActionState(s => ({ ...s, [bookingId]: 'Cancelling…' }));
    try {
      const r = await fetch(`${API}/api/player/bookings/${bookingId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user._id })
      });
      if (r.ok) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
        setActionState(s => ({ ...s, [bookingId]: null }));
      } else {
        setActionState(s => ({ ...s, [bookingId]: null }));
        alert('Failed to cancel');
      }
    } catch { alert('Network error'); setActionState(s => ({ ...s, [bookingId]: null })); }
  };

  const leaveMatch = async (groupId) => {
    if (!window.confirm("Are you sure you want to leave this game?")) return;
    try {
      const r = await fetch(`${API}/api/matches/${groupId}/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user._id })
      });
      if (r.ok) {
        load();
      } else {
        alert('Failed to leave game');
      }
    } catch { alert('Network error'); }
  };

  const tabs = [
    { id: 'requests', label: 'Join Requests', count: requests.length },
    { id: 'matches', label: 'Team Matches', count: groups.length },
    { id: 'bookings', label: 'Court Bookings', count: bookings.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader title="My Activity" icon={Activity} />

      <div className="bg-white/5 backdrop-blur-xl p-2 rounded-[2rem] flex gap-2 ring-1 ring-white/10 shadow-sm overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} className={`flex-1 whitespace-nowrap flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${view === t.id ? 'bg-white text-slate-900 shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
            {t.label}
            {t.count > 0 && <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${view === t.id ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white/5 ring-1 ring-white/10 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : view === 'requests' ? (
        requests.length === 0 ? (
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 py-24 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center justify-center mb-6"><UsersIcon className="w-8 h-8 text-slate-400" /></div>
            <p className="text-white font-black text-2xl tracking-tight mb-2">No Pending Requests</p>
            <p className="text-slate-400 text-sm max-w-sm">When someone sends you a join request, it will appear here for you to Accept or Decline.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {requests.map(req => {
              const st = actionState[req._id];
              const accepted = st === 'Accepted ✓';
              const declined = st === 'Declined';
              const done = accepted || declined;
              const isChallenge = req.type === 'challenge';
              return (
                <div key={req._id} className={`bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] ring-1 transition-all duration-500 ${accepted ? 'ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : declined ? 'ring-white/5 opacity-50' : 'ring-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.15)]'} flex flex-col sm:flex-row sm:items-center gap-6`}>
                  <div className={`p-4 rounded-2xl shrink-0 ${isChallenge ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'}`}>
                    {isChallenge ? <Trophy className="w-7 h-7" /> : <UsersIcon className="w-7 h-7" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{isChallenge ? 'Squad Challenge ⚔️' : 'Join Request 🏅'}</p>
                    <h4 className="text-white font-black text-lg tracking-tight leading-tight">{req.from_name}</h4>
                    <p className="text-slate-300 text-sm font-medium mt-1">Wants you for <strong className="text-white">{req.sport}</strong> in <strong className="text-white">{req.area}</strong></p>
                    {req.from_phone && <p className="text-slate-500 text-xs mt-1.5 font-mono">📞 {req.from_phone}</p>}
                  </div>
                  {done ? (
                    <div className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest ring-1 ${accepted ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40' : 'bg-white/5 text-slate-500 ring-white/10'}`}>
                      {st}
                    </div>
                  ) : (
                    <div className="flex gap-3 shrink-0 flex-col sm:flex-row flex-wrap justify-end">
                      {onChat && (
                        <button
                          onClick={() => onChat({
                            requestId: req._id,
                            captainName: req.from_name,
                            sport: req.sport,
                            area: req.area
                          })}
                          disabled={!!st}
                          className="px-5 py-3.5 text-xs font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/30 hover:bg-indigo-500/40 ring-1 ring-indigo-500/50 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Message
                        </button>
                      )}
                      <button onClick={() => respond(req._id, 'decline')} disabled={!!st} className="px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 ring-1 ring-white/10 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                        {st === 'Declining…' ? '…' : 'Decline'}
                      </button>
                      {isChallenge ? (
                        <button onClick={() => respond(req._id, 'accept')} disabled={!!st} className="px-5 py-3.5 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                          {st === 'Accepting…' ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Accepting</> : <><Check className="w-4 h-4" /> Accept</>}
                        </button>
                      ) : (
                        <button onClick={() => respond(req._id, 'accept')} disabled={!!st} className="px-5 py-3.5 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                          {st === 'Accepting…' ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Accepting</> : <><Check className="w-4 h-4" /> Accept</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : view === 'matches' ? (
        groups.length === 0
          ? <div className="bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 py-24 text-center flex flex-col items-center"><div className="w-20 h-20 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center justify-center mb-6"><Activity className="w-8 h-8 text-slate-400" /></div><p className="text-white font-black text-2xl mb-2">No team matches yet.</p></div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{groups.map(g => <MatchCard key={g._id} group={g} playerId={user._id} onJoin={() => { }} onPay={onPay} onTeam={onTeam} onChat={onChat} onLeave={leaveMatch} mine={true} />)}</div>
      ) : (
        bookings.length === 0
          ? <div className="bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 py-24 text-center flex flex-col items-center"><div className="w-20 h-20 bg-white/5 ring-1 ring-white/10 rounded-2xl flex items-center justify-center mb-6"><Calendar className="w-8 h-8 text-slate-400" /></div><p className="text-white font-black text-2xl mb-2">No bookings yet.</p></div>
          : <div className="bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden divide-y divide-white/10">
            {bookings.map(b => (
              <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 hover:bg-white/5 transition-colors gap-6 group">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-indigo-500/20 ring-1 ring-indigo-500/40 text-indigo-300 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all"><CheckCircle2 className="w-7 h-7" /></div>
                  <div>
                    <p className="text-white font-black text-xl tracking-tight">{b.indoor_name || b.court}</p>
                    <p className="text-slate-300 text-sm font-bold mt-1">{b.court} • {b.sport}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="bg-white/5 ring-1 ring-white/20 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                      <span className="bg-white/5 ring-1 ring-white/20 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 gap-3">
                  <StatusBadge status={b.status} />
                  {(b.status === 'Pending' || b.status === 'Confirmed') && (
                    <button onClick={() => cancelBooking(b._id)} disabled={!!actionState[b._id]} className="px-4 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 ring-1 ring-rose-500/20 rounded-xl transition-all">
                      {actionState[b._id] || 'Cancel Booking'}
                    </button>
                  )}
                  <p className="text-white text-2xl font-black mt-2">LKR {Number(b.amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
      )}
      {payForRequest && <InvitePayModal reqId={payForRequest} onClose={() => setPayForRequest(null)} onSuccess={() => { setPayForRequest(null); respond(payForRequest, 'accept'); }} />}
    </div>
  );
}

// ── Upcoming Schedule Widget ───────────────────────────────────────────────────
function UpcomingScheduleWidget({ userId, refreshKey }) {
  const [upcoming, setUpcoming] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchUpcoming = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/player/upcoming/${userId}`);
      if (r.ok) {
        const d = await r.json();
        setUpcoming(d.upcoming);
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchUpcoming();
    const id = setInterval(fetchUpcoming, 60000);
    return () => clearInterval(id);
  }, [fetchUpcoming, refreshKey]);

  useEffect(() => {
    if (!upcoming) return;
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(upcoming.datetime);
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Happening Now!');
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      let str = '';
      if (d > 0) str += `${d}d `;
      str += `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
      setTimeLeft(str);
    };
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [upcoming]);

  if (!upcoming) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] ring-1 ring-white/20 text-white mb-8 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-6">
         <div className="flex items-center gap-5">
           <div className="p-4 bg-white/20 rounded-2xl ring-1 ring-white/30 text-white shadow-inner">
             <Calendar className="w-8 h-8" />
           </div>
           <div>
              <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Upcoming Schedule</p>
              <h4 className="text-3xl font-black tracking-tight">{upcoming.title}</h4>
              <p className="text-indigo-200 font-bold text-sm mt-1">{upcoming.subtitle} • <span className="text-white">{upcoming.datetime_str}</span></p>
           </div>
         </div>
         <div className="bg-[#0A0F1C]/40 backdrop-blur-md px-6 py-4 rounded-2xl ring-1 ring-white/10 text-right w-full md:w-auto shrink-0 border border-white/5">
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1 text-center md:text-right">Starts In</p>
            <div className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-200 text-center md:text-right">{timeLeft}</div>
         </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function PlayersDashboard() {
  const navigate = useNavigate();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => { if (!user || user.role !== 'player') navigate('/login'); }, []);

  const [tab, setTab] = useState(sessionStorage.getItem('player_active_tab') || 'preferences');

  useEffect(() => {
    sessionStorage.setItem('player_active_tab', tab);
  }, [tab]);
  const [notifications, setNotifs] = useState([]);
  const [payGroup, setPayGroup] = useState(null);
  const [teamGroup, setTeamGroup] = useState(null);
  const [chatGroup, setChatGroup] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const reload = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const fetchLatestUser = async () => {
      if (!user?._id) return;
      try {
        const r = await fetch(`${API}/api/player/profile?player_id=${user._id}`);
        if (r.ok) {
          const d = await r.json();
          if (d.user) sessionStorage.setItem('user', JSON.stringify(d.user));
        }
      } catch (err) {
        console.error("Sync failed", err);
      }
    };
    fetchLatestUser();
  }, [user?._id]);

  const loadNotifs = useCallback(async () => {
    if (!user?._id) return;
    try { const r = await fetch(`${API}/api/player/notifications?player_id=${user._id}`); const d = await r.json(); setNotifs(d.notifications || []); } catch { }
  }, [user?._id]);

  useEffect(() => { loadNotifs(); const id = setInterval(loadNotifs, 15000); return () => clearInterval(id); }, [loadNotifs]);
  const markRead = async id => { await fetch(`${API}/api/player/notifications/${id}/read`, { method: 'POST' }); loadNotifs(); };

  const handleJoin = async gid => {
    try {
      const r = await fetch(`${API}/api/matches/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: user._id, group_id: gid }) });
      if (r.ok) { reload(); loadNotifs(); setTab('my-activity'); } else { const d = await r.json(); alert(d.error || 'Could not join'); }
    } catch { alert('Server error'); }
  };

  if (!user) return null;

  const TABS = [
    { id: 'preferences', label: "Preferences", icon: <Sparkles className="w-5 h-5" /> },
    { id: 'find-matches', label: 'Find Match', icon: <Target className="w-5 h-5" /> },
    { id: 'book-indoor', label: 'Book Court', icon: <Map className="w-5 h-5" /> },
    { id: 'my-activity', label: 'Activity', icon: <Activity className="w-5 h-5" /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="flex bg-[#030712] font-sans text-slate-200 selection:bg-indigo-500/40 selection:text-white h-screen overflow-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`body{font-family:'Outfit',sans-serif; background-color: #030712;} .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 20px; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-[17rem] bg-[#0A0F1C]/80 backdrop-blur-3xl border-r border-white/10 hidden lg:flex flex-col z-[70] shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/10 shrink-0">
          <Target className="w-7 h-7 text-indigo-400 mr-3" />
          <span className="text-2xl font-black text-white tracking-tighter">FIND ME</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-2 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Player Portal</p>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-black rounded-2xl transition-all duration-300 ${tab === t.id ? 'bg-indigo-500/10 text-indigo-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <span className={`${tab === t.id ? 'scale-110 transition-transform' : ''}`}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0 bg-white/[0.02]">
          <button onClick={() => { sessionStorage.removeItem('user'); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden">
        {/* Deep Midnight Mesh Orbs */}
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>
        <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/4 -right-40 w-[40rem] h-[40rem] bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>

        {/* Top Header */}
        <div className="relative z-[60] shrink-0 border-b border-white/5">
          <PlayerHeader user={user} setTab={setTab} notifications={notifications} onMarkRead={markRead} />
        </div>

        {/* Mobile / Tablet Dock Component */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[70]">
          <div className="pointer-events-auto bg-[#0A0F1C]/95 backdrop-blur-3xl p-2.5 rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.8)] ring-1 ring-white/20 flex gap-2 overflow-x-auto no-scrollbar max-w-full">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 text-sm font-black rounded-[1.2rem] transition-all duration-300 ${tab === t.id ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                <span className={`${tab === t.id ? 'opacity-100 text-slate-900' : 'opacity-50'}`}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar p-5 md:p-8 lg:p-10 pb-32 lg:pb-10">
          <div className="max-w-6xl mx-auto relative h-full">
            <UpcomingScheduleWidget userId={user._id} refreshKey={refreshKey} />
            {tab === 'preferences' && <PreferencesTab user={user} onSaved={() => { reload(); setTab('my-activity'); }} />}
            {tab === 'find-matches' && <FindMatchesTab user={user} />}
            {tab === 'book-indoor' && <BookIndoorTab user={user} onDone={() => { reload(); setTab('my-activity'); }} />}
            {tab === 'my-activity' && <MyActivityTab user={user} onPay={setPayGroup} onTeam={setTeamGroup} onChat={setChatGroup} refreshKey={refreshKey} onRefresh={reload} />}
            {tab === 'chats' && <ChatsTab user={user} onChat={setChatGroup} />}
            {tab === 'profile' && <PlayerProfile user={user} onUpdate={(u) => { sessionStorage.setItem('user', JSON.stringify(u)); window.location.reload(); }} />}
          </div>
        </main>
      </div>

      {payGroup && <PayModal group={payGroup} playerId={user._id} onClose={() => setPayGroup(null)} onSuccess={() => { setPayGroup(null); reload(); loadNotifs(); }} />}
      {teamGroup && <TeamModal group={teamGroup} onClose={() => setTeamGroup(null)} />}
      {chatGroup && <GroupChatModal group={chatGroup} user={user} onClose={() => setChatGroup(null)} />}
    </div>
  );
}