import { useState } from 'react';

export default function OwnerSignUpView({ onAuthSuccess }) {
  const [formData, setFormData] = useState({
    owner_name: '',
    indoor_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    province: '',
    district: '',
    town: '',
    address: '',
    hourly_rate: '',
    opening_time: '06:00',
    closing_time: '23:00',
    turf_image: null,
    // NEW: List of facilities with sport type and quantity
    facilities: [{ sport: 'Football', count: 1, isMultipurpose: false }]
  });

  const [error, setError] = useState('');

  const sriLankaData = {
    "Western": {
      "Colombo": ["Colombo 01-15", "Dehiwala", "Nugegoda", "Maharagama", "Battaramulla"],
      "Gampaha": ["Negombo", "Gampaha City", "Wattala", "Kiribathgoda"],
      "Kalutara": ["Panadura", "Kalutara City", "Horana"]
    },
    "Central": {
      "Kandy": ["Kandy City", "Peradeniya", "Katugastota"],
      "Matale": ["Matale City", "Dambulla"],
      "Nuwara Eliya": ["Nuwara Eliya Town", "Hatton"]
    },
    "Southern": {
      "Galle": ["Galle Fort", "Karapitiya", "Hikkaduwa"],
      "Matara": ["Matara City", "Weligama"],
      "Hambantota": ["Hambantota Town", "Tangalle"]
    }
  };

  const sportsList = ["Football", "Cricket", "Badminton", "Basketball", "Tennis", "Futsal"];

  // Handlers for dynamic facility fields
  const addFacility = () => {
    setFormData({
      ...formData,
      facilities: [...formData.facilities, { sport: 'Football', count: 1, isMultipurpose: false }]
    });
  };

  const removeFacility = (index) => {
    const updated = formData.facilities.filter((_, i) => i !== index);
    setFormData({ ...formData, facilities: updated });
  };

  const updateFacility = (index, field, value) => {
    const updated = formData.facilities.map((fac, i) => 
      i === index ? { ...fac, [field]: value } : fac
    );
    setFormData({ ...formData, facilities: updated });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, turf_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) onAuthSuccess(data.user);
      else setError(data.error || "Registration failed");
    } catch (err) {
      setError("Server connection failed. Check if Flask is running.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-20 px-4">
      <div className="w-full max-w-4xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            List Your <span className="text-blue-500">Indoor</span>
          </h2>
          <p className="text-slate-500 text-sm mt-2">Professional Indoor Management Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold text-center uppercase tracking-[0.2em]">
            {error}
          </div>
        )}

        <form onSubmit={handleOwnerRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* General Information */}
          <div className="space-y-4 col-span-full">
             <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">General Information</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Turf Name" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50" 
                  onChange={(e) => setFormData({...formData, indoor_name: e.target.value})} />
                <input type="text" placeholder="Owner Full Name" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50" 
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})} />
             </div>
          </div>

          {/* DYNAMIC SPORTS & TURF COUNT SECTION */}
          <div className="col-span-full bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-6">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Available Sports & Inventory</label>
              <button type="button" onClick={addFacility} className="bg-blue-600 text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 transition-all">
                + Add Sport
              </button>
            </div>

            {formData.facilities.map((fac, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-black/20 p-4 rounded-2xl border border-white/5 group">
                <div>
                  <label className="text-[8px] text-slate-500 uppercase font-black mb-1 block ml-2">Sport Type</label>
                  <select 
                    value={fac.sport}
                    onChange={(e) => updateFacility(index, 'sport', e.target.value)}
                    className="w-full bg-[#0f172a] p-3 rounded-xl border border-white/10 text-white text-xs outline-none"
                  >
                    {sportsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] text-slate-500 uppercase font-black mb-1 block ml-2">Total Turfs/Courts</label>
                  <input 
                    type="number" min="1" value={fac.count}
                    onChange={(e) => updateFacility(index, 'count', parseInt(e.target.value))}
                    className="w-full bg-[#0f172a] p-3 rounded-xl border border-white/10 text-white text-xs outline-none"
                  />
                </div>

                <div className="flex items-center h-[46px] px-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" checked={fac.isMultipurpose}
                      onChange={(e) => updateFacility(index, 'isMultipurpose', e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Multipurpose Turf (Players can play Cricket & Football in same turf) </span>
                  </label>
                </div>

                <div className="flex justify-end">
                  {formData.facilities.length > 1 && (
                    <button type="button" onClick={() => removeFacility(index)} className="text-red-500 text-[9px] font-black uppercase hover:underline">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing & Timing */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Rates & Timing</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-xs tracking-tighter">LKR</div>
              <input type="text" placeholder="Charge Per Hour" required className="w-full bg-white/5 p-4 pl-14 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50 font-mono"
                onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} />
            </div>
            <div className="flex gap-2 items-center">
              <input type="time" className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none text-xs" 
                onChange={(e) => setFormData({...formData, opening_time: e.target.value})} />
              <span className="text-slate-600 text-[10px] font-black italic">TO</span>
              <input type="time" className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none text-xs" 
                onChange={(e) => setFormData({...formData, closing_time: e.target.value})} />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Turf Photo (Optional)</label>
            <div className="relative h-[115px] bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
              {formData.turf_image ? (
                <img src={formData.turf_image} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Select Image</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                </>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4 col-span-full">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Location Details</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="bg-[#020617] p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50 text-sm"
                onChange={(e) => setFormData({...formData, province: e.target.value, district: '', town: ''})}>
                <option value="">Province</option>
                {Object.keys(sriLankaData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select disabled={!formData.province} className="bg-[#020617] p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50 disabled:opacity-30 text-sm"
                onChange={(e) => setFormData({...formData, district: e.target.value, town: ''})}>
                <option value="">District</option>
                {formData.province && Object.keys(sriLankaData[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select disabled={!formData.district} className="bg-[#020617] p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50 disabled:opacity-30 text-sm"
                onChange={(e) => setFormData({...formData, town: e.target.value})}>
                <option value="">Town</option>
                {formData.district && sriLankaData[formData.province][formData.district].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4 col-span-full">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Physical Address</label>
            <textarea placeholder="No. 123, High Level Rd, Nugegoda" required rows="2" className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50 resize-none"
              onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          {/* Security */}
          <div className="space-y-4 col-span-full">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Security & Credentials</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input type="email" placeholder="Business Email" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50"
                 onChange={(e) => setFormData({...formData, email: e.target.value})} />
               <input type="tel" placeholder="Phone Number" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50"
                 onChange={(e) => setFormData({...formData, phone: e.target.value})} />
               <input type="password" placeholder="Create Password" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50"
                 onChange={(e) => setFormData({...formData, password: e.target.value})} />
               <input type="password" placeholder="Confirm Password" required className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white outline-none focus:border-blue-500/50"
                 onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="col-span-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-white mt-4 shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
            Register Facility
          </button>
        </form>
      </div>
    </div>
  );
}