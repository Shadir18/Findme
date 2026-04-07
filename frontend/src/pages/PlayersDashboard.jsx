import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://127.0.0.1:5000';

const SL = {
  "Western":{"Colombo":["Colombo 01-15","Dehiwala","Nugegoda","Maharagama","Battaramulla","Moratuwa","Homagama"],"Gampaha":["Gampaha City","Negombo","Wattala","Kelaniya","Kiribathgoda","Kadawatha","Ja-Ela"],"Kalutara":["Kalutara City","Panadura","Horana","Beruwala","Aluthgama"]},
  "Central":{"Kandy":["Kandy City","Peradeniya","Katugastota","Gampola","Nawalapitiya"],"Matale":["Matale City","Dambulla","Sigiriya"],"Nuwara Eliya":["Nuwara Eliya Town","Hatton","Thalawakele"]},
  "Southern":{"Galle":["Galle City","Hikkaduwa","Ambalangoda","Elpitiya"],"Matara":["Matara City","Weligama","Akuressa"],"Hambantota":["Hambantota Town","Tangalle","Tissamaharama"]},
  "North Western":{"Kurunegala":["Kurunegala City","Kuliyapitiya","Pannala","Wariyapola"],"Puttalam":["Puttalam Town","Chilaw","Wennappuwa","Kalpitiya"]},
  "Sabaragamuwa":{"Ratnapura":["Ratnapura City","Pelmadulla","Balangoda","Embilipitiya"],"Kegalle":["Kegalle Town","Mawanella","Warakapola"]},
  "Eastern":{"Trincomalee":["Trincomalee City","Kinniya","Kantale"],"Batticaloa":["Batticaloa City","Kattankudy","Valachchenai"],"Ampara":["Ampara Town","Kalmunai","Arugam Bay"]},
  "Uva":{"Badulla":["Badulla City","Bandarawela","Haputale","Ella"],"Monaragala":["Monaragala Town","Wellawaya","Kataragama"]},
  "North Central":{"Anuradhapura":["Anuradhapura City","Kekirawa","Mihintale"],"Polonnaruwa":["Polonnaruwa City","Kaduruwela"]},
  "Northern":{"Jaffna":["Jaffna City","Nallur","Chavakachcheri","Point Pedro"],"Vavuniya":["Vavuniya Town","Nedunkeni"],"Mannar":["Mannar Town","Murunkan"]},
};
const SPORTS = ['Futsal','Football','Indoor Cricket','Badminton','Basketball','Tennis'];
const CAP = {Futsal:10,Football:10,'Indoor Cricket':10,Badminton:4,Basketball:10,Tennis:4};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── Shared atoms ───────────────────────────────────────────────────────────────
const lbl = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-0.5';
const inp = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const sel = `${inp} appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`;

function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-base font-bold text-gray-800 tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gray-200" />
      {right && <span className="text-gray-400 text-xs font-semibold">{right}</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {open:'bg-blue-50 text-blue-700 border-blue-200',confirmed:'bg-green-50 text-green-700 border-green-200',fully_paid:'bg-purple-50 text-purple-700 border-purple-200',Pending:'bg-yellow-50 text-yellow-700 border-yellow-200',Confirmed:'bg-green-50 text-green-700 border-green-200',Cancelled:'bg-red-50 text-red-700 border-red-200'};
  const c = map[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${c}`}>{status?.replace('_',' ')}</span>;
}

function ProgressBar({ count, capacity }) {
  const pct = Math.min((count/capacity)*100,100);
  const full = count >= capacity;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{count}/{capacity} players</span>
        <span className={`font-bold ${full?'text-green-600':'text-blue-600'}`}>{full?'Full — Confirmed':`${capacity-count} spots left`}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${full?'bg-green-500':'bg-blue-500'}`} style={{width:`${pct}%`}} />
      </div>
    </div>
  );
}

// ── Location Cascade ───────────────────────────────────────────────────────────
function LocationCascade({ value, onChange }) {
  const provinces = Object.keys(SL);
  const districts = value.province ? Object.keys(SL[value.province]) : [];
  const towns = value.province && value.district ? SL[value.province][value.district] || [] : [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className={lbl}>Province</label>
        <select className={sel} value={value.province||''} onChange={e=>onChange({province:e.target.value,district:'',town:''})}>
          <option value="">Select Province</option>
          {provinces.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>District</label>
        <select className={sel} disabled={!value.province} value={value.district||''} onChange={e=>onChange({...value,district:e.target.value,town:''})}>
          <option value="">Select District</option>
          {districts.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Town</label>
        <select className={sel} disabled={!value.district} value={value.town||''} onChange={e=>onChange({...value,town:e.target.value})}>
          <option value="">Select Town</option>
          {towns.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Notification Bell ──────────────────────────────────────────────────────────
function NotifBell({ notifications, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n=>!n.read).length;
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="relative p-2 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-blue-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {unread>0&&<span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">{unread}</span>}
      </button>
      {open&&(
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 font-bold text-sm">Notifications</span>
            {unread>0&&<button onClick={()=>{notifications.forEach(n=>!n.read&&onMarkRead(n._id));setOpen(false);}} className="text-blue-600 text-xs font-semibold hover:text-blue-700">Mark all read</button>}
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {notifications.length===0
              ?<p className="text-gray-400 text-sm text-center py-8">No notifications</p>
              :notifications.slice(0,10).map(n=>(
                <div key={n._id} onClick={()=>onMarkRead(n._id)} className={`px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition cursor-pointer ${!n.read?'':'opacity-60'}`}>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-xs font-semibold">{n.title}</p>
                    <p className="text-gray-500 text-xs leading-snug mt-0.5">{n.message}</p>
                  </div>
                  {!n.read&&<div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0"/>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payment Modal (match group) ────────────────────────────────────────────────
function PayModal({ group, playerId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({card_number:'',card_name:'',expiry:'',cvv:''});
  const [err, setErr] = useState('');
  const amt = group ? Math.round(3500/Math.max(group.player_count||1,1)) : 0;

  const fmt = (v,f) => {
    if(f==='card_number') return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
    if(f==='expiry') return v.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2');
    if(f==='cvv') return v.replace(/\D/g,'').slice(0,3);
    return v;
  };

  const submit = async e => {
    e.preventDefault();
    if(!form.card_number||!form.card_name||!form.expiry||!form.cvv){setErr('All fields required.');return;}
    setErr('');setStep(2);
    try{
      const r=await fetch(`${API}/api/matches/${group._id}/pay`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_id:playerId,...form})});
      if(r.ok){setStep(3);setTimeout(onSuccess,1800);}else{const d=await r.json();setErr(d.error||'Failed');setStep(1);}
    }catch{setErr('Server error');setStep(1);}
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">Secure Payment</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">{group?.sport} · {group?.area}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-sm">✕</button>
        </div>
        <div className="p-4 bg-blue-50 border-b border-blue-100 text-center">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Your Share</p>
          <p className="text-gray-900 text-2xl font-black">LKR {amt.toLocaleString()}</p>
        </div>
        <div className="p-7">
          {step===1&&(
            <form onSubmit={submit} className="space-y-5">
              {err&&<p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
              <div><label className={lbl}>Card Number</label><input className={inp+' font-mono tracking-widest'} placeholder="1234 5678 9012 3456" value={form.card_number} onChange={e=>setForm(f=>({...f,card_number:fmt(e.target.value,'card_number')}))} /></div>
              <div><label className={lbl}>Cardholder Name</label><input className={inp} placeholder="KAMAL PERERA" value={form.card_name} onChange={e=>setForm(f=>({...f,card_name:e.target.value.toUpperCase()}))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Expiry</label><input className={inp+' font-mono'} placeholder="MM/YY" value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:fmt(e.target.value,'expiry')}))} /></div>
                <div><label className={lbl}>CVV</label><input type="password" className={inp+' font-mono'} placeholder="•••" value={form.cvv} onChange={e=>setForm(f=>({...f,cvv:fmt(e.target.value,'cvv')}))} /></div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {['VISA','MC','AMEX'].map(b=><span key={b} className="text-[10px] font-black text-gray-400 border border-gray-200 rounded px-2 py-0.5">{b}</span>)}
                <span className="text-[10px] text-gray-400 ml-auto">🔒 SSL Secured</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Pay LKR {amt.toLocaleString()}</button>
              </div>
            </form>
          )}
          {step===2&&<div className="text-center py-10"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-700 text-sm font-bold">Processing…</p></div>}
          {step===3&&<div className="text-center py-10"><div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div><p className="text-gray-800 font-black text-lg">Payment Successful!</p><p className="text-gray-500 text-sm mt-1">Your spot is confirmed.</p></div>}
        </div>
      </div>
    </div>
  );
}

// ── Booking Modal (court slot) ─────────────────────────────────────────────────
function BookingModal({ turf, court, playerId, onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [step, setStep] = useState(1);
  const [card, setCard] = useState({card_number:'',card_name:'',expiry:'',cvv:''});
  const [err, setErr] = useState('');

  const open = parseInt((turf?.timing?.open||'06:00').split(':')[0]);
  const close = parseInt((turf?.timing?.close||'23:00').split(':')[0]);
  const slots = [];
  for(let h=open;h<close;h++) slots.push(`${String(h).padStart(2,'0')}:00 - ${String(h+1).padStart(2,'0')}:00`);
  const rate = Number(turf?.pricing?.weekday?.day||turf?.pricing?.standard||1500);

  const fmt = (v,f) => {
    if(f==='card_number') return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
    if(f==='expiry') return v.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2');
    if(f==='cvv') return v.replace(/\D/g,'').slice(0,3);
    return v;
  };

  const handlePay = async e => {
    e.preventDefault();
    if(!card.card_number||!card.card_name||!card.expiry||!card.cvv){setErr('All card fields required.');return;}
    setErr('');
    try{
      const r=await fetch(`${API}/api/player/book`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_id:playerId,owner_id:turf._id,court_id:court._id,court_name:court.name,sport:court.sport,date,time_slot:slot,amount:rate,indoor_name:turf.indoor_name})});
      if(r.ok){setStep(3);setTimeout(onSuccess,1800);}else{const d=await r.json();setErr(d.error||'Failed');}
    }catch{setErr('Server error.');}
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">{turf?.indoor_name}</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">{court?.name} · {court?.sport}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-sm">✕</button>
        </div>

        {step===1&&(
          <div className="p-7 space-y-5">
            {err&&<p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
            <div><label className={lbl}>Select Date</label><input type="date" min={new Date().toISOString().split('T')[0]} className={inp} value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div>
              <label className={lbl}>Select Time Slot</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {slots.map(t=>(
                  <button key={t} type="button" onClick={()=>setSlot(t)} className={`px-2 py-2 rounded-xl border text-xs font-bold transition ${slot===t?'bg-gray-900 text-white border-gray-900':'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Rate Per Hour</span>
              <span className="text-gray-800 font-black text-lg">LKR {rate.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition">Cancel</button>
              <button onClick={()=>{if(!date||!slot){setErr('Select date and slot.');return;}setErr('');setStep(2);}} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Proceed to Payment</button>
            </div>
          </div>
        )}

        {step===2&&(
          <form onSubmit={handlePay} className="p-7 space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Booking Total</p>
              <p className="text-gray-900 text-2xl font-black">LKR {rate.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-1">{date} · {slot}</p>
            </div>
            {err&&<p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
            <div><label className={lbl}>Card Number</label><input className={inp+' font-mono tracking-widest'} placeholder="1234 5678 9012 3456" value={card.card_number} onChange={e=>setCard(f=>({...f,card_number:fmt(e.target.value,'card_number')}))} /></div>
            <div><label className={lbl}>Cardholder Name</label><input className={inp} placeholder="KAMAL PERERA" value={card.card_name} onChange={e=>setCard(f=>({...f,card_name:e.target.value.toUpperCase()}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Expiry</label><input className={inp+' font-mono'} placeholder="MM/YY" value={card.expiry} onChange={e=>setCard(f=>({...f,expiry:fmt(e.target.value,'expiry')}))} /></div>
              <div><label className={lbl}>CVV</label><input type="password" className={inp+' font-mono'} placeholder="•••" value={card.cvv} onChange={e=>setCard(f=>({...f,cvv:fmt(e.target.value,'cvv')}))} /></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={()=>{setStep(1);setErr('');}} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition">← Back</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirm & Pay</button>
            </div>
          </form>
        )}

        {step===3&&<div className="p-10 text-center"><div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div><p className="text-gray-800 font-black text-lg uppercase italic tracking-tight">Booking Confirmed!</p><p className="text-gray-500 text-sm mt-1">Awaiting owner approval. Check My Activity.</p></div>}
      </div>
    </div>
  );
}

// ── Team Modal ─────────────────────────────────────────────────────────────────
function TeamModal({ group, onClose }) {
  const cap = CAP[group?.sport]||10;
  const empty = cap-(group?.player_count||0);
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-tight">{group?.sport} Squad</h3>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">{group?.area}</p>
          </div>
          <StatusBadge status={group?.status}/>
        </div>
        <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
          {(group?.players||[]).map((p,i)=>(
            <div key={p.player_id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-black shrink-0">{(p.name||'P')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-gray-800 text-sm font-bold truncate">{p.name}</p><p className="text-gray-400 text-xs">Player {i+1}</p></div>
              {p.paid&&<span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Paid</span>}
            </div>
          ))}
          {[...Array(Math.max(empty,0))].map((_,i)=>(
            <div key={i} className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">+</div>
              <p className="text-gray-400 text-xs italic">Waiting for player…</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-3"><ProgressBar count={group?.player_count||0} capacity={cap}/></div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-[2rem]">
          <button onClick={onClose} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Match Card ─────────────────────────────────────────────────────────────────
function MatchCard({ group, playerId, onJoin, onPay, onTeam, mine }) {
  const cap = CAP[group.sport]||10;
  const inGroup = (group.players||[]).some(p=>p.player_id===playerId);
  const myEntry = (group.players||[]).find(p=>p.player_id===playerId);
  const full = (group.player_count||0)>=cap;
  const sportIcons = {Futsal:'⚽',Football:'🏈','Indoor Cricket':'🏏',Badminton:'🏸',Basketball:'🏀',Tennis:'🎾'};

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">{sportIcons[group.sport]||'🏅'}</div>
          <div>
            <p className="text-gray-800 font-black text-base uppercase tracking-tight italic">{group.sport}</p>
            <p className="text-gray-500 text-xs font-medium">{group.area}{group.preferred_time?` · ${group.preferred_time}`:''}</p>
          </div>
        </div>
        <StatusBadge status={group.status}/>
      </div>
      <div className="mb-4"><ProgressBar count={group.player_count||0} capacity={cap}/></div>
      <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-3">
        <button onClick={()=>onTeam(group)} className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">View Squad</button>
        {!mine&&!inGroup&&!full&&<button onClick={()=>onJoin(group._id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow transition active:scale-95">Join</button>}
        {inGroup&&group.status==='confirmed'&&!myEntry?.paid&&<button onClick={()=>onPay(group)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow transition active:scale-95">Pay Now</button>}
        {inGroup&&myEntry?.paid&&<span className="px-3 py-2 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg uppercase tracking-widest">Paid ✓</span>}
        {inGroup&&group.status==='open'&&<span className="px-3 py-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg uppercase tracking-widest">In Queue</span>}
      </div>
    </div>
  );
}

// ── Tab: Preferences ───────────────────────────────────────────────────────────
function PreferencesTab({ user, onSaved }) {
  const [prefs, setPrefs] = useState({sport:'Futsal',loc:{province:'',district:'',town:''},days:['Sat','Sun'],time:'evening'});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const sportIcons = {Futsal:'⚽',Football:'🏈','Indoor Cricket':'🏏',Badminton:'🏸',Basketball:'🏀',Tennis:'🎾'};

  const save = async () => {
    if(!prefs.loc.district){setMsg({ok:false,text:'Please select at least a District.'});return;}
    setSaving(true);setMsg(null);
    try{
      const r=await fetch(`${API}/api/player/availability`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_id:user._id,sport:prefs.sport,area:prefs.loc.district,province:prefs.loc.province,district:prefs.loc.district,town:prefs.loc.town,preferred_days:prefs.days,preferred_time:prefs.time})});
      if(r.ok){setMsg({ok:true,text:'Preferences saved! Finding your match…'});setTimeout(onSaved,1200);}
      else{const d=await r.json();setMsg({ok:false,text:d.error||'Error saving.'});}
    }catch{setMsg({ok:false,text:'Cannot reach server.'});}
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Match Preferences" right="Auto-matched by area & sport"/>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className={lbl}>Sport</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-2">
          {SPORTS.map(s=>(
            <button key={s} onClick={()=>setPrefs(p=>({...p,sport:s}))} className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition ${prefs.sport===s?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'}`}>
              <span className="text-2xl">{sportIcons[s]}</span>
              <span className="leading-tight text-center text-[10px]">{s}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mt-3 ml-0.5">{CAP[prefs.sport]} players required per team</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className={lbl}>Your Location</label>
        <LocationCascade value={prefs.loc} onChange={loc=>setPrefs(p=>({...p,loc}))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className={lbl}>Available Days</label>
          <div className="flex gap-2 flex-wrap mt-2">
            {DAYS.map(d=>(
              <button key={d} onClick={()=>setPrefs(p=>({...p,days:p.days.includes(d)?p.days.filter(x=>x!==d):[...p.days,d]}))} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${prefs.days.includes(d)?'bg-gray-900 text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className={lbl}>Preferred Time</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[{v:'morning',l:'Morning',s:'6–12 AM'},{v:'afternoon',l:'Afternoon',s:'12–6 PM'},{v:'evening',l:'Evening',s:'6–11 PM'}].map(t=>(
              <button key={t.v} onClick={()=>setPrefs(p=>({...p,time:t.v}))} className={`rounded-xl border-2 py-3 text-center transition ${prefs.time===t.v?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
                <p className={`font-black text-xs uppercase tracking-widest ${prefs.time===t.v?'text-blue-700':'text-gray-500'}`}>{t.l}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.s}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg&&<div className={`p-4 rounded-xl text-sm font-semibold border ${msg.ok?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-600 border-red-200'}`}>{msg.text}</div>}

      <button onClick={save} disabled={saving} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">
        {saving?'Saving…':'Save Preferences & Find Match'}
      </button>
    </div>
  );
}

// ── Tab: Find Matches ──────────────────────────────────────────────────────────
function FindMatchesTab({ user, onJoin, onPay, onTeam }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fSport, setFS] = useState('');
  const [fDist, setFD] = useState('');

  const load = useCallback(async()=>{
    setLoading(true);
    try{const p=new URLSearchParams();if(fSport)p.append('sport',fSport);if(fDist)p.append('area',fDist);const r=await fetch(`${API}/api/matches/open?${p}`);const d=await r.json();setGroups(d.groups||[]);}catch{setGroups([]);}
    setLoading(false);
  },[fSport,fDist]);
  useEffect(()=>{load();},[load]);

  const allDistricts = [...new Set(Object.values(SL).flatMap(p=>Object.keys(p)))].sort();

  return (
    <div className="space-y-5">
      <SectionHeader title="Open Matches" right={`${groups.length} group${groups.length!==1?'s':''} found`}/>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-end">
        <div><label className={lbl}>Sport</label><select className={sel.replace('w-full','')+' min-w-[140px]'} value={fSport} onChange={e=>setFS(e.target.value)}><option value="">All Sports</option>{SPORTS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className={lbl}>District</label><select className={sel.replace('w-full','')+' min-w-[160px]'} value={fDist} onChange={e=>setFD(e.target.value)}><option value="">All Districts</option>{allDistricts.map(d=><option key={d}>{d}</option>)}</select></div>
        <button onClick={load} className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition">Refresh</button>
      </div>
      {loading?(<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"/>)}</div>)
      :groups.length===0?(<div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center"><p className="text-gray-400 text-sm font-semibold">No open matches found. Set preferences or change filters.</p></div>)
      :(<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{groups.map(g=><MatchCard key={g._id} group={g} playerId={user._id} onJoin={onJoin} onPay={onPay} onTeam={onTeam} mine={false}/>)}</div>)}
    </div>
  );
}

// ── Tab: Book Indoor ───────────────────────────────────────────────────────────
function BookIndoorTab({ user, onDone }) {
  const [loc, setLoc] = useState({province:'',district:'',town:''});
  const [sport, setSport] = useState('');
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookTarget, setBook] = useState(null);

  const search = async()=>{
    if(!loc.district){alert('Please select a District.');return;}
    setLoading(true);setSearched(true);
    try{const p=new URLSearchParams({district:loc.district});if(loc.province)p.append('province',loc.province);if(loc.town)p.append('town',loc.town);if(sport)p.append('sport',sport);const r=await fetch(`${API}/api/turfs?${p}`);const d=await r.json();setTurfs(d.turfs||[]);}catch{setTurfs([]);}
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Book Indoor Court" right="Find a facility near you"/>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        <LocationCascade value={loc} onChange={setLoc}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div><label className={lbl}>Sport (Optional)</label><select className={sel} value={sport} onChange={e=>setSport(e.target.value)}><option value="">All Sports</option>{SPORTS.map(s=><option key={s}>{s}</option>)}</select></div>
          <button onClick={search} disabled={loading} className="py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow transition active:scale-95">{loading?'Searching…':'Search Facilities'}</button>
        </div>
      </div>

      {searched&&!loading&&turfs.length===0&&(
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center"><p className="text-gray-400 text-sm font-semibold">No facilities found. Try a broader district or remove sport filter.</p></div>
      )}

      {turfs.map(turf=>(
        <div key={turf._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-start gap-5 p-6">
            {turf.turf_image?<img src={turf.turf_image} alt={turf.indoor_name} className="w-24 h-20 object-cover rounded-xl border border-gray-100 shrink-0"/>:<div className="w-24 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-3xl shrink-0">🏟️</div>}
            <div className="flex-1 min-w-0">
              <h4 className="text-gray-800 font-black text-lg uppercase italic tracking-tight">{turf.indoor_name}</h4>
              <p className="text-gray-500 text-xs font-medium mt-1">{[turf.address?.town,turf.address?.district,turf.address?.province].filter(Boolean).join(', ')}</p>
              {turf.phone&&<p className="text-gray-400 text-xs mt-1">{turf.phone}</p>}
              <p className="text-gray-400 text-xs mt-1">Open {turf.timing?.open||'06:00'} – {turf.timing?.close||'23:00'}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 px-6 pb-6">
            <label className={lbl+' mt-4'}>Available Courts</label>
            <div className="space-y-2 mt-2">
              {turf.courts.map(court=>(
                <div key={court._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
                  <div><p className="text-gray-800 font-bold text-sm">{court.name}</p><p className="text-gray-400 text-xs">{court.sport}</p></div>
                  <div className="flex items-center gap-4">
                    <p className="text-gray-500 text-xs font-mono">LKR {Number(turf.pricing?.weekday?.day||turf.pricing?.standard||1500).toLocaleString()}/hr</p>
                    <button onClick={()=>setBook({turf,court})} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow transition active:scale-95">Book</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {bookTarget&&<BookingModal turf={bookTarget.turf} court={bookTarget.court} playerId={user._id} onClose={()=>setBook(null)} onSuccess={()=>{setBook(null);onDone();}}/>}
    </div>
  );
}

// ── Tab: My Activity ───────────────────────────────────────────────────────────
function MyActivityTab({ user, onPay, onTeam, refreshKey }) {
  const [groups, setGroups] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('matches');

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{const[gr,bk]=await Promise.all([fetch(`${API}/api/player/matches/${user._id}`).then(r=>r.json()),fetch(`${API}/api/player/bookings/${user._id}`).then(r=>r.json())]);setGroups(gr.groups||[]);setBookings(bk.bookings||[]);}catch{}
      setLoading(false);
    };load();
  },[user._id,refreshKey]);

  const tabs=[{id:'matches',label:'Team Matches',count:groups.length},{id:'bookings',label:'Court Bookings',count:bookings.length}];

  return (
    <div className="space-y-5">
      <SectionHeader title="My Activity"/>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1 flex gap-1">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${view===t.id?'bg-gray-900 text-white shadow':'text-gray-400 hover:text-gray-700'}`}>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${view===t.id?'bg-white/20 text-white':'bg-gray-100 text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading?(<div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse"/>)}</div>)
      :view==='matches'?(
        groups.length===0
          ?<div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center"><p className="text-gray-400 text-sm">No team matches yet. Set preferences or browse Find Match.</p></div>
          :<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{groups.map(g=><MatchCard key={g._id} group={g} playerId={user._id} onJoin={()=>{}} onPay={onPay} onTeam={onTeam} mine={true}/>)}</div>
      ):(
        bookings.length===0
          ?<div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center"><p className="text-gray-400 text-sm">No court bookings yet. Use Book Indoor to find a facility.</p></div>
          :<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {bookings.map(b=>(
                <div key={b._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-gray-800 font-bold text-sm">{b.indoor_name||b.court}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{b.court} · {b.sport}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{b.date} · {b.time}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={b.status}/>
                    <p className="text-gray-500 text-xs font-mono mt-1.5">LKR {Number(b.amount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function PlayersDashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(()=>{if(!user||user.role!=='player')navigate('/login');},[]);

  const [tab, setTab] = useState('preferences');
  const [notifications, setNotifs] = useState([]);
  const [payGroup, setPayGroup] = useState(null);
  const [teamGroup, setTeamGroup] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const reload = ()=>setRefreshKey(k=>k+1);

  const loadNotifs = useCallback(async()=>{
    if(!user?._id)return;
    try{const r=await fetch(`${API}/api/player/notifications?player_id=${user._id}`);const d=await r.json();setNotifs(d.notifications||[]);}catch{}
  },[user?._id]);

  useEffect(()=>{loadNotifs();const id=setInterval(loadNotifs,15000);return()=>clearInterval(id);},[loadNotifs]);
  const markRead=async id=>{await fetch(`${API}/api/player/notifications/${id}/read`,{method:'POST'});loadNotifs();};

  const handleJoin=async gid=>{
    try{const r=await fetch(`${API}/api/matches/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_id:user._id,group_id:gid})});
    if(r.ok){reload();loadNotifs();setTab('my-activity');}else{const d=await r.json();alert(d.error||'Could not join');}}catch{alert('Server error');}
  };

  if(!user)return null;

  const TABS=[{id:'preferences',label:"Preferences"},{id:'find-matches',label:'Find Match'},{id:'book-indoor',label:'Book Indoor'},{id:'my-activity',label:'My Activity'}];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-10">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"/>
      <style>{`body{font-family:'Inter',sans-serif}`}</style>

      {/* Header — identical to OwnerHeader */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <span className="text-2xl font-black text-blue-600 italic tracking-tighter shrink-0">FIND ME</span>
            <div className="hidden md:block shrink-0 ml-3 pl-4 border-l border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Welcome back</p>
              <p className="text-gray-800 font-bold text-sm">{user.name} <span className="text-blue-600">· Player</span></p>
            </div>
            <div className="flex-1"/>
            <div className="flex items-center gap-2">
              <NotifBell notifications={notifications} onMarkRead={markRead}/>
              <div className="relative">
                <button onClick={()=>navigate('/')} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 transition">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">{user.name?.[0]||'P'}</div>
                  <span className="text-gray-700 text-xs font-semibold hidden sm:block">{user.name?.split(' ')[0]}</span>
                </button>
              </div>
              <button onClick={()=>{localStorage.removeItem('user');navigate('/');}} className="p-2 rounded-full hover:bg-red-50 transition text-gray-400 hover:text-red-500" title="Logout">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-nav — identical to owner sub-nav */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center gap-2 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${tab===t.id?'bg-gray-900 text-white shadow-md':'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-12">
        {tab==='preferences'  && <PreferencesTab user={user} onSaved={()=>{reload();setTab('my-activity');}}/>}
        {tab==='find-matches' && <FindMatchesTab user={user} onJoin={handleJoin} onPay={setPayGroup} onTeam={setTeamGroup}/>}
        {tab==='book-indoor'  && <BookIndoorTab  user={user} onDone={()=>{reload();setTab('my-activity');}}/>}
        {tab==='my-activity'  && <MyActivityTab  user={user} onPay={setPayGroup} onTeam={setTeamGroup} refreshKey={refreshKey}/>}
      </main>

      {payGroup  && <PayModal group={payGroup} playerId={user._id} onClose={()=>setPayGroup(null)} onSuccess={()=>{setPayGroup(null);reload();loadNotifs();}}/>}
      {teamGroup && <TeamModal group={teamGroup} onClose={()=>setTeamGroup(null)}/>}
    </div>
  );
}
