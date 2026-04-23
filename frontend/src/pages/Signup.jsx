import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, ArrowRight, Upload, Trash2, X } from 'lucide-react';

const sriLankaData = {
  "Western": {
    "Colombo": ["Colombo 01-15", "Dehiwala", "Nugegoda", "Maharagama", "Battaramulla", "Kotte", "Moratuwa", "Homagama", "Avissawella", "Pannipitiya"],
    "Gampaha": ["Gampaha City", "Negombo", "Wattala", "Kelaniya", "Kiribathgoda", "Kadawatha", "Minuwangoda", "Ja-Ela", "Peliyagoda"],
    "Kalutara": ["Kalutara City", "Panadura", "Horana", "Matugama", "Bandaragama", "Beruwala", "Aluthgama"]
  },
  "Central": {
    "Kandy": ["Kandy City", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya", "Kadugannawa", "Akurana"],
    "Matale": ["Matale City", "Dambulla", "Sigiriya", "Galewela", "Ukuwela"],
    "Nuwara Eliya": ["Nuwara Eliya Town", "Hatton", "Thalawakele", "Nanu Oya", "Maskeliya"]
  },
  "Southern": {
    "Galle": ["Galle City", "Hikkaduwa", "Karapitiya", "Ambalantota", "Beliatta"],
    "Matara": ["Matara City", "Weligama", "Akuressa", "Kamburugamuwa", "Dikwella", "Matara Fort"],
    "Hambantota": ["Hambantota Town", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta"]
  },
  "North Western": {
    "Kurunegala": ["Kurunegala City", "Kuliyapitiya", "Pannala", "Narammala", "Wariyapola", "Mawathagama"],
    "Puttalam": ["Puttalam Town", "Chilaw", "Wennappuwa", "Marawila", "Nattandiya", "Kalpitiya"]
  },
  "Sabaragamuwa": {
    "Ratnapura": ["Ratnapura City", "Pelmadulla", "Balangoda", "Kahawatta", "Embilipitiya", "Kuruwita"],
    "Kegalle": ["Kegalle Town", "Mawanella", "Warakapola", "Rambukkana", "Ruwanwella", "Deraniyagala"]
  },
  "Eastern": {
    "Trincomalee": ["Trincomalee City", "Kinniya", "Muttur", "Kantale", "Nilaveli"],
    "Batticaloa": ["Batticaloa City", "Kattankudy", "Kalkudah", "Valachchenai", "Eravur"],
    "Ampara": ["Ampara Town", "Kalmunai", "Samanthurai", "Pottuvil", "Akkaraipattu", "Arugam Bay"]
  },
  "Uva": {
    "Badulla": ["Badulla City", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya", "Ella"],
    "Monaragala": ["Monaragala Town", "Bibile", "Wellawaya", "Kataragama", "Buttala"]
  },
  "North Central": {
    "Anuradhapura": ["Anuradhapura City", "Kekirawa", "Thambuththegama", "Medawachchiya", "Eppawala", "Mihintale"],
    "Polonnaruwa": ["Polonnaruwa City", "Kaduruwela", "Hingurakgoda", "Medirigiriya", "Welikanda"]
  },
  "Northern": {
    "Jaffna": ["Jaffna City", "Nallur", "Chavakachcheri", "Point Pedro", "Kankesanthurai", "Chunnakam"],
    "Kilinochchi": ["Kilinochchi Town", "Pallai", "Paranthan"],
    "Mannar": ["Mannar Town", "Murunkan", "Pesalai"],
    "Vavuniya": ["Vavuniya Town", "Nedunkeni", "Cheddikulam"],
    "Mullaitivu": ["Mullaitivu Town", "Puthukkudiyiruppu", "Mankulam"]
  }
};

const sportsList = ["Cricket", "Badminton", "Basketball", "Tennis", "Futsal"];

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('player');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTown, setIsCustomTown] = useState(false);

  const [hasDayNightPricing, setHasDayNightPricing] = useState(false);
  const [hasWeekendPricing, setHasWeekendPricing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    indoor_name: '',
    province: '',
    district: '',
    town: '',
    address: '',
    standard_rate: '',
    day_rate: '',
    night_rate: '',
    weekday_rate: '',
    weekend_rate: '',
    weekday_day_rate: '',
    weekday_night_rate: '',
    weekend_day_rate: '',
    weekend_night_rate: '',
    opening_time: '06:00',
    closing_time: '23:00',
    turf_image: null,
    facilities: [{ sport: 'Futsal', count: 1, isMultipurpose: false }]
  });

  const addFacility = () => {
    setFormData({ ...formData, facilities: [...formData.facilities, { sport: 'Football', count: 1, isMultipurpose: false }] });
  };

  const removeFacility = (index) => {
    const updated = formData.facilities.filter((_, i) => i !== index);
    setFormData({ ...formData, facilities: updated });
  };

  const updateFacility = (index, field, value) => {
    const updated = formData.facilities.map((fac, i) => i === index ? { ...fac, [field]: value } : fac);
    setFormData({ ...formData, facilities: updated });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, turf_image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      let payload = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role,
        name: formData.name
      };

      if (role === 'player') {
        payload.dob = formData.dob;
        payload.area = formData.town;
        payload.address = { province: formData.province, district: formData.district, town: formData.town };
      } else {
        payload.indoor_name = formData.indoor_name;
        payload.address = { province: formData.province, district: formData.district, town: formData.town, physical: formData.address };
        payload.timing = { open: formData.opening_time, close: formData.closing_time };

        let finalPricing = { weekday: { day: '', night: '' }, weekend: { day: '', night: '' } };
        if (!hasDayNightPricing && !hasWeekendPricing) {
          finalPricing = { weekday: { day: formData.standard_rate, night: formData.standard_rate }, weekend: { day: formData.standard_rate, night: formData.standard_rate } };
        } else if (hasDayNightPricing && !hasWeekendPricing) {
          finalPricing = { weekday: { day: formData.day_rate, night: formData.night_rate }, weekend: { day: formData.day_rate, night: formData.night_rate } };
        } else if (!hasDayNightPricing && hasWeekendPricing) {
          finalPricing = { weekday: { day: formData.weekday_rate, night: formData.weekday_rate }, weekend: { day: formData.weekend_rate, night: formData.weekend_rate } };
        } else {
          finalPricing = { weekday: { day: formData.weekday_day_rate, night: formData.weekday_night_rate }, weekend: { day: formData.weekend_day_rate, night: formData.weekend_night_rate } };
        }
        payload.pricing = finalPricing;
        payload.facilities = formData.facilities;
        payload.turf_image = formData.turf_image;
      }

      const response = await fetch('http://127.0.0.1:5000/api/signup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setIsVerifying(true);
        if (data.debug_otp) console.log("OTP Sent (simulated)");
      } else {
        setError(data.error || "Registration Request Failed");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otp }),
      });

      const data = await response.json();
      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || "Verification Failed");
      }
    } catch {
      setError("Server error during verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3.5 bg-[#0A0F1C]/80 border-2 border-white/10 hover:border-white/20 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:bg-[#0A0F1C] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-300";
  const labelCls = "text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1 mb-1.5 block";
  const sectionCls = "text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-16 animate-fadeIn font-sans relative z-10">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className={`w-full transition-all duration-500 relative z-10 ${role === 'player' ? 'max-w-xl' : 'max-w-3xl'}`}>

        <div className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3 ring-1 ring-indigo-500/40">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                {role === 'player' ? <>Join the <span className="text-indigo-400">Squad</span></> : <>List Your <span className="text-emerald-400">Indoor</span></>}
              </h2>
              <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">
                {role === 'player' ? 'Create your elite player profile' : 'Professional Indoor Management Portal'}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">

            <div className="flex bg-white/5 rounded-full p-1.5 mb-8 shadow-inner max-w-sm mx-auto ring-1 ring-white/10">
              <button type="button" onClick={() => setRole('player')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all ${role === 'player' ? 'bg-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Player</button>
              <button type="button" onClick={() => setRole('turf_owner')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all ${role === 'turf_owner' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Turf Owner</button>
            </div>

            {error && <div className="bg-rose-500/10 text-rose-300 p-4 rounded-2xl mb-6 text-sm text-center font-bold border border-rose-500/30 flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>{error}</div>}

            <form onSubmit={handleRegister} className="space-y-8">

              {/* --- SECTION 1: ACCOUNT BASICS --- */}
              <div>
                <h3 className={sectionCls}>Account Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input type="text" required placeholder="Kamal Perera" className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" required placeholder="kamal@example.com" className={inputCls} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" required placeholder="07XXXXXXXX" className={inputCls} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  {role === 'player' ? (
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" required className={inputCls} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                    </div>
                  ) : (
                    <div>
                      <label className={labelCls}>Indoor / Facility Name</label>
                      <input type="text" required placeholder="Kandy Futsal Arena" className={inputCls} value={formData.indoor_name} onChange={(e) => setFormData({ ...formData, indoor_name: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>

              {/* --- SECTION 2: LOCATION --- */}
              <div>
                <h3 className={sectionCls}>Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <select required className={`${inputCls} appearance-none [&>option]:bg-slate-900 [&>option]:text-white`}
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value, district: '', town: '' })}
                  >
                    <option value="">Province</option>
                    {Object.keys(sriLankaData).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>

                  <select required disabled={!formData.province} className={`${inputCls} appearance-none disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-slate-900 [&>option]:text-white`}
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value, town: '' })}
                  >
                    <option value="">District</option>
                    {formData.province && Object.keys(sriLankaData[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <div className="relative">
                    {!isCustomTown ? (
                      <select required disabled={!formData.district} className={`${inputCls} appearance-none disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-slate-900 [&>option]:text-white`}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM') { setIsCustomTown(true); setFormData({ ...formData, town: '' }); }
                          else { setFormData({ ...formData, town: e.target.value }); }
                        }}
                        value={formData.town}
                      >
                        <option value="">Town</option>
                        {formData.district && sriLankaData[formData.province][formData.district].map(t => <option key={t} value={t}>{t}</option>)}
                        {role === 'turf_owner' && <option value="CUSTOM" className="text-emerald-400 font-bold">+ ADD NEW TOWN</option>}
                      </select>
                    ) : (
                      <div className="relative">
                        <input type="text" placeholder="Type Town Name" className={`${inputCls} !border-emerald-500/50 focus:!border-emerald-500`} value={formData.town} onChange={(e) => setFormData({ ...formData, town: e.target.value })} />
                        <button type="button" onClick={() => { setIsCustomTown(false); setFormData({ ...formData, town: '' }); }} className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center hover:bg-rose-600 transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
                {role === 'turf_owner' && (
                  <textarea placeholder="Physical Address (Road, No, Landmarks)" className={`${inputCls} h-20 resize-none`} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                )}
              </div>

              {/* --- SECTION 3: OWNER SPECIFICS --- */}
              {role === 'turf_owner' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-emerald-500/5 p-6 rounded-[2rem] ring-1 ring-emerald-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-emerald-300 uppercase tracking-widest">Sport Facilities</h3>
                      <button type="button" onClick={addFacility} className="bg-emerald-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-emerald-500 shadow-sm transition-all">+ Add Facility</button>
                    </div>
                    <div className="space-y-3">
                      {formData.facilities.map((fac, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                          <select value={fac.sport} onChange={(e) => updateFacility(index, 'sport', e.target.value)} className={`${inputCls} flex-1 !py-2.5 !text-xs [&>option]:bg-slate-900 [&>option]:text-white`}>
                            {sportsList.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500">COUNT:</span>
                            <input type="number" min="1" value={fac.count} onChange={(e) => updateFacility(index, 'count', parseInt(e.target.value))} className={`${inputCls} w-16 !py-2.5 !text-xs text-center`} />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer px-2">
                            <input type="checkbox" checked={fac.isMultipurpose} onChange={(e) => updateFacility(index, 'isMultipurpose', e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Multi</span>
                          </label>
                          {formData.facilities.length > 1 && (
                            <button type="button" onClick={() => removeFacility(index)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className={sectionCls}>Pricing & Timing</h3>
                      <div className="space-y-4">
                        {!hasDayNightPricing && !hasWeekendPricing && (
                          <div className="relative">
                            <div className="absolute left-4 top-3.5 text-xs font-bold text-slate-500">LKR</div>
                            <input type="number" placeholder="Standard Hourly Rate" className={`${inputCls} pl-12 font-mono`} value={formData.standard_rate} onChange={(e) => setFormData({ ...formData, standard_rate: e.target.value })} />
                          </div>
                        )}
                        {hasDayNightPricing && !hasWeekendPricing && (
                          <div className="flex gap-3 animate-fadeIn">
                            <input type="number" placeholder="Day Rate" className={`${inputCls} !text-xs font-mono`} value={formData.day_rate} onChange={(e) => setFormData({ ...formData, day_rate: e.target.value })} />
                            <input type="number" placeholder="Night Rate" className={`${inputCls} !text-xs font-mono`} value={formData.night_rate} onChange={(e) => setFormData({ ...formData, night_rate: e.target.value })} />
                          </div>
                        )}
                        {!hasDayNightPricing && hasWeekendPricing && (
                          <div className="flex gap-3 animate-fadeIn">
                            <input type="number" placeholder="Weekday Rate" className={`${inputCls} !text-xs font-mono`} value={formData.weekday_rate} onChange={(e) => setFormData({ ...formData, weekday_rate: e.target.value })} />
                            <input type="number" placeholder="Weekend Rate" className={`${inputCls} !text-xs font-mono`} value={formData.weekend_rate} onChange={(e) => setFormData({ ...formData, weekend_rate: e.target.value })} />
                          </div>
                        )}
                        {hasDayNightPricing && hasWeekendPricing && (
                          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                            <div className="space-y-2 bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block text-center">Weekday</span>
                              <input type="number" placeholder="Day" className={`${inputCls} !py-2 !text-xs font-mono`} value={formData.weekday_day_rate} onChange={(e) => setFormData({ ...formData, weekday_day_rate: e.target.value })} />
                              <input type="number" placeholder="Night" className={`${inputCls} !py-2 !text-xs font-mono`} value={formData.weekday_night_rate} onChange={(e) => setFormData({ ...formData, weekday_night_rate: e.target.value })} />
                            </div>
                            <div className="space-y-2 bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block text-center">Weekend</span>
                              <input type="number" placeholder="Day" className={`${inputCls} !py-2 !text-xs font-mono`} value={formData.weekend_day_rate} onChange={(e) => setFormData({ ...formData, weekend_day_rate: e.target.value })} />
                              <input type="number" placeholder="Night" className={`${inputCls} !py-2 !text-xs font-mono`} value={formData.weekend_night_rate} onChange={(e) => setFormData({ ...formData, weekend_night_rate: e.target.value })} />
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-white/5 rounded-2xl ring-1 ring-white/10 space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={hasDayNightPricing} onChange={(e) => setHasDayNightPricing(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Day vs Night Rates?</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={hasWeekendPricing} onChange={(e) => setHasWeekendPricing(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Weekday vs Weekend?</span>
                          </label>
                        </div>
                        <div className="flex gap-2 items-center bg-white/5 p-3 rounded-2xl ring-1 ring-white/10">
                          <input type="time" className="flex-1 bg-transparent px-2 text-sm text-white outline-none" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} />
                          <span className="text-[10px] font-black italic text-slate-500">TO</span>
                          <input type="time" className="flex-1 bg-transparent px-2 text-sm text-white outline-none" value={formData.closing_time} onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className={sectionCls}>Facility Image</h3>
                      <div className="relative h-40 bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-emerald-500/50 transition-all group">
                        {formData.turf_image ? (
                          <img src={formData.turf_image} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="text-center group-hover:scale-110 transition-transform">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400"><Upload className="w-5 h-5" /></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload Photo</span>
                          </div>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- SECTION 4: SECURITY --- */}
              <div>
                <h3 className={sectionCls}>Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>New Password</label>
                    <input type="password" required placeholder="••••••••" className={inputCls} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password</label>
                    <input type="password" required placeholder="••••••••" className={inputCls} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className={`w-full text-white py-5 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-70 ${role === 'player' ? 'bg-white hover:bg-slate-200 text-slate-900 shadow-[0_0_25px_rgba(255,255,255,0.2)]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]'}`}>
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/10 pt-6">
              <p className="text-slate-500 text-xs">
                Already a member?{' '}
                <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 uppercase tracking-wider">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP VERIFICATION MODAL */}
      {isVerifying && (
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="bg-white/5 border-b border-white/10 p-8 text-center relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${role === 'player' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Verify Your Account</h3>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-2">We sent a 6-digit code to {formData.phone}</p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="p-8">
              {error && <div className="bg-rose-500/10 text-rose-300 p-4 rounded-2xl mb-6 text-sm text-center font-bold border border-rose-500/30">{error}</div>}

              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block text-center">Enter Verification Code</label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="••••••"
                  className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 rounded-2xl border-2 border-white/10 focus:border-indigo-500 outline-none transition-all bg-[#0A0F1C]/80 text-white"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-white ${role === 'player' ? 'bg-white hover:bg-slate-200 text-slate-900' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {isSubmitting ? 'Verifying...' : 'Complete Registration'}
              </button>

              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="w-full mt-4 py-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition"
              >
                Go Back to Signup
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}