import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    "Galle": ["Galle City", "Hikkaduwa", "Karapitiya", "Ambalangoda", "Elpitiya", "Koggala", "Baddegama"],
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

const sportsList = ["Football", "Cricket", "Badminton", "Basketball", "Tennis", "Futsal"];

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('player');
  const [error, setError] = useState('');
  
  const [hasDayNightPricing, setHasDayNightPricing] = useState(false);
  const [hasWeekendPricing, setHasWeekendPricing] = useState(false);
  
  // NEW: State to track if the user wants to type a custom town
  const [isCustomTown, setIsCustomTown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    area: '',
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

  // Helper to reset town when District/Province changes
  const handleDistrictChange = (e) => {
    setFormData({...formData, district: e.target.value, town: ''});
    setIsCustomTown(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      let payload = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role
      };

      if (role === 'player') {
        payload.name = formData.name;
        payload.dob = formData.dob;
        payload.area = formData.area;
      } else {
        payload.name = formData.name; 
        payload.indoor_name = formData.indoor_name;
        payload.address = { province: formData.province, district: formData.district, town: formData.town, physical: formData.address };
        payload.timing = { open: formData.opening_time, close: formData.closing_time };
        
        let finalPricing = { weekday: { day: '', night: '' }, weekend: { day: '', night: '' } };
        
        if (!hasDayNightPricing && !hasWeekendPricing) {
          finalPricing = { 
            weekday: { day: formData.standard_rate, night: formData.standard_rate }, 
            weekend: { day: formData.standard_rate, night: formData.standard_rate } 
          };
        } else if (hasDayNightPricing && !hasWeekendPricing) {
          finalPricing = { 
            weekday: { day: formData.day_rate, night: formData.night_rate }, 
            weekend: { day: formData.day_rate, night: formData.night_rate } 
          };
        } else if (!hasDayNightPricing && hasWeekendPricing) {
          finalPricing = { 
            weekday: { day: formData.weekday_rate, night: formData.weekday_rate }, 
            weekend: { day: formData.weekend_rate, night: formData.weekend_rate } 
          };
        } else {
          finalPricing = { 
            weekday: { day: formData.weekday_day_rate, night: formData.weekday_night_rate }, 
            weekend: { day: formData.weekend_day_rate, night: formData.weekend_night_rate } 
          };
        }
        
        payload.pricing = finalPricing;
        payload.facilities = formData.facilities;
        payload.turf_image = formData.turf_image;
      }

      const response = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || "Registration Failed");
      }
    } catch (err) {
      setError("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 animate-fadeIn font-sans">
      <div className={`w-full transition-all duration-500 ${role === 'player' ? 'max-w-lg' : 'max-w-2xl'}`}>
        
        <div className={`rounded-t-[2.5rem] p-8 text-center shadow-lg transition-colors duration-500 ${role === 'player' ? 'bg-gradient-to-br from-blue-700 to-blue-500' : 'bg-gradient-to-br from-green-700 to-green-500'}`}>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
            {role === 'player' ? <>JOIN THE <span className="text-yellow-300">SQUAD</span></> : <>LIST YOUR <span className="text-yellow-300">INDOOR</span></>}
          </h2>
          <p className="text-white/80 text-sm mt-2 font-light uppercase tracking-widest">
            {role === 'player' ? 'Create your elite player profile' : 'Professional Indoor Management Portal'}
          </p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-b-[2.5rem] shadow-xl border-x border-b border-gray-100">
          
          <div className="flex bg-gray-100 rounded-full p-1 mb-8 shadow-inner max-w-sm mx-auto">
            <button type="button" onClick={() => setRole('player')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-full transition-all ${role === 'player' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Player</button>
            <button type="button" onClick={() => setRole('turf_owner')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-full transition-all ${role === 'turf_owner' ? 'bg-white text-green-700 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Turf Owner</button>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-bold border border-red-100">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* PLAYER FIELDS */}
            {role === 'player' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                  <input type="text" required placeholder="Kamal Perera" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Phone</label>
                    <input type="tel" required placeholder="07XXXXXXXX" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Birthday</label>
                    <input type="date" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all text-sm text-gray-500" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Living Area</label>
                  <input type="text" required placeholder="e.g. Colombo 07" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all text-sm" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
                </div>
              </div>
            )}

            {/* TURF OWNER FIELDS */}
            {role === 'turf_owner' && (
              <div className="space-y-8">
                
                {/* ... (General Info, Inventory, Pricing, Timing, Image remain exactly the same as the previous step) ... */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">General Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Turf / Facility Name" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none transition-all text-sm" value={formData.indoor_name} onChange={(e) => setFormData({...formData, indoor_name: e.target.value})} />
                    <input type="text" placeholder="Owner Full Name" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none transition-all text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>

                {/* (Truncated for space, keeping your exact previous code for Inventory, Pricing, Timing, Photo) */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sports & Inventory</h3>
                    <button type="button" onClick={addFacility} className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full hover:bg-green-200">+ Add Sport</button>
                  </div>
                  <div className="space-y-3">
                    {formData.facilities.map((fac, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <select value={fac.sport} onChange={(e) => updateFacility(index, 'sport', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-100 text-sm focus:border-green-500 outline-none">
                          {sportsList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="number" min="1" value={fac.count} onChange={(e) => updateFacility(index, 'count', parseInt(e.target.value))} className="w-20 px-3 py-2 rounded-lg border-2 border-gray-100 text-sm focus:border-green-500 outline-none text-center" />
                        <label className="flex items-center gap-2 cursor-pointer pr-4">
                          <input type="checkbox" checked={fac.isMultipurpose} onChange={(e) => updateFacility(index, 'isMultipurpose', e.target.checked)} className="w-4 h-4 accent-green-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Multipurpose</span>
                        </label>
                        {formData.facilities.length > 1 && (
                          <button type="button" onClick={() => removeFacility(index)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Rates & Timing</h3>
                    <div className="mb-4">
                      <div className="animate-fadeIn mb-4">
                        {!hasDayNightPricing && !hasWeekendPricing && (
                          <div className="relative">
                            <div className="absolute left-4 top-3 text-xs font-bold text-gray-400">LKR</div>
                            <input type="number" placeholder="Standard Hourly Rate" required className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none transition-all text-sm font-mono" value={formData.standard_rate} onChange={(e) => setFormData({...formData, standard_rate: e.target.value})} />
                          </div>
                        )}
                        {hasDayNightPricing && !hasWeekendPricing && (
                          <div className="flex gap-3">
                            <input type="number" placeholder="Day Rate" required className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.day_rate} onChange={(e) => setFormData({...formData, day_rate: e.target.value})} />
                            <input type="number" placeholder="Night Rate" required className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.night_rate} onChange={(e) => setFormData({...formData, night_rate: e.target.value})} />
                          </div>
                        )}
                        {!hasDayNightPricing && hasWeekendPricing && (
                          <div className="flex gap-3">
                            <input type="number" placeholder="Weekday Rate" required className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekday_rate} onChange={(e) => setFormData({...formData, weekday_rate: e.target.value})} />
                            <input type="number" placeholder="Weekend Rate" required className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekend_rate} onChange={(e) => setFormData({...formData, weekend_rate: e.target.value})} />
                          </div>
                        )}
                        {hasDayNightPricing && hasWeekendPricing && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block text-center">Weekday</span>
                              <input type="number" placeholder="Day" required className="w-full px-2 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekday_day_rate} onChange={(e) => setFormData({...formData, weekday_day_rate: e.target.value})} />
                              <input type="number" placeholder="Night" required className="w-full px-2 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekday_night_rate} onChange={(e) => setFormData({...formData, weekday_night_rate: e.target.value})} />
                            </div>
                            <div className="space-y-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block text-center">Weekend</span>
                              <input type="number" placeholder="Day" required className="w-full px-2 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekend_day_rate} onChange={(e) => setFormData({...formData, weekend_day_rate: e.target.value})} />
                              <input type="number" placeholder="Night" required className="w-full px-2 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 outline-none text-xs font-mono" value={formData.weekend_night_rate} onChange={(e) => setFormData({...formData, weekend_night_rate: e.target.value})} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={hasDayNightPricing} onChange={(e) => setHasDayNightPricing(e.target.checked)} className="w-4 h-4 accent-green-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-colors hover:text-green-600">Different rate for Day vs Night?</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={hasWeekendPricing} onChange={(e) => setHasWeekendPricing(e.target.checked)} className="w-4 h-4 accent-green-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-colors hover:text-green-600">Different rate for Weekends?</span>
                        </label>
                      </div>
                    </div>
                    <div>
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Operating Hours</span>
                       <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <input type="time" className="flex-1 bg-transparent px-2 text-sm outline-none text-gray-600" value={formData.opening_time} onChange={(e) => setFormData({...formData, opening_time: e.target.value})} />
                        <span className="text-gray-400 text-[10px] font-black italic">TO</span>
                        <input type="time" className="flex-1 bg-transparent px-2 text-sm outline-none text-gray-600" value={formData.closing_time} onChange={(e) => setFormData({...formData, closing_time: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Turf Photo</h3>
                    <div className="relative h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-green-500 transition-colors">
                      {formData.turf_image ? (
                        <img src={formData.turf_image} className="w-full h-full object-cover opacity-80" alt="Preview" />
                      ) : (
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">+ Select Image</span>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </div>
                </div>

                {/* THE NEW CUSTOM TOWN LOGIC */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-sm bg-white" onChange={(e) => { setFormData({...formData, province: e.target.value, district: '', town: ''}); setIsCustomTown(false); }}>
                      <option value="">Province</option>
                      {Object.keys(sriLankaData).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select disabled={!formData.province} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-sm bg-white disabled:bg-gray-50" onChange={handleDistrictChange}>
                      <option value="">District</option>
                      {formData.province && Object.keys(sriLankaData[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    
                    {/* Dynamic Town Field: Select OR Text Input */}
                    {!isCustomTown ? (
                      <select disabled={!formData.district} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-sm bg-white disabled:bg-gray-50" 
                        value={formData.town}
                        onChange={(e) => {
                          if (e.target.value === 'OTHER') {
                            setIsCustomTown(true);
                            setFormData({...formData, town: ''});
                          } else {
                            setFormData({...formData, town: e.target.value});
                          }
                        }}
                      >
                        <option value="">Town</option>
                        {formData.district && sriLankaData[formData.province][formData.district].map(t => <option key={t} value={t}>{t}</option>)}
                        {/* THE MAGIC BUTTON */}
                        {formData.district && <option value="OTHER" className="font-bold text-green-600 bg-green-50">+ Add New Town...</option>}
                      </select>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text" 
                          required 
                          placeholder="Type your town..." 
                          className="w-full px-4 py-3 rounded-xl border-2 border-green-500 focus:border-green-600 outline-none text-sm pr-10 bg-green-50" 
                          value={formData.town} 
                          onChange={(e) => setFormData({...formData, town: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          onClick={() => { setIsCustomTown(false); setFormData({...formData, town: ''}); }}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 font-bold"
                          title="Cancel custom town"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea placeholder="Full Physical Address" required rows="2" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-sm resize-none" onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            )}

            {/* SHARED CREDENTIALS */}
            <div className={`pt-4 ${role === 'turf_owner' ? 'border-t border-gray-100' : ''}`}>
               {role === 'turf_owner' && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Security & Credentials</h3>}
               
               <div className="space-y-4">
                 {role === 'turf_owner' && (
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Phone Number</label>
                     <input type="tel" required placeholder="011XXXXXXX" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                   </div>
                 )}

                 <div>
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
                   <input type="email" required placeholder="name@example.com" className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none transition-all text-sm ${role === 'player' ? 'focus:border-blue-500' : 'focus:border-green-500'}`} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Password</label>
                     <input type="password" required placeholder="••••••••" className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none transition-all text-sm ${role === 'player' ? 'focus:border-blue-500' : 'focus:border-green-500'}`} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Confirm</label>
                     <input type="password" required placeholder="••••••••" className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none transition-all text-sm ${role === 'player' ? 'focus:border-blue-500' : 'focus:border-green-500'}`} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                   </div>
                 </div>
               </div>
            </div>

            <button type="submit" className={`w-full text-white py-4 rounded-full font-black text-sm shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 mt-6 uppercase tracking-widest ${role === 'player' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {role === 'player' ? 'Register Player' : 'Register Facility'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-xs">
              Already a member? 
              <Link to="/login" className="text-blue-700 font-bold hover:underline ml-1 uppercase tracking-wider">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}