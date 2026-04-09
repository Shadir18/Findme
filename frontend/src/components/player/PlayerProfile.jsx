import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Map as MapIcon, Trash2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

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

export default function PlayerProfile({ user, onUpdate }) {
  const cleanVal = (val) => {
    if (!val || typeof val !== 'string') return val;
    return val.split("'")[0].split(":")[0].trim();
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: cleanVal(user?.phone || user?.mobile || ''),
    province: user?.province || user?.address?.province || '',
    district: user?.district || user?.address?.district || '',
    city: user?.city || user?.town || user?.address?.town || '',
    profile_picture: user?.profile_picture || null
  });

  // Keep form in sync with user prop updates (important for fresh DB fetches)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: cleanVal(user.phone || user.mobile || user.user_phone || ''),
        province: user.province || user.address?.province || '',
        district: user.district || user.address?.district || '',
        city: user.city || user.town || user.address?.town || '',
        profile_picture: user.profile_picture || null
      });
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'province') {
      setFormData({ ...formData, province: value, district: '', city: '' });
    } else if (name === 'district') {
      setFormData({ ...formData, district: value, city: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setSuccess(null);
    setError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch(`${API}/api/player/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, player_id: user._id || user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Profile updated successfully!');
        sessionStorage.setItem('user', JSON.stringify(data.user));
        if (onUpdate) onUpdate(data.user);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-blue-100 p-1 bg-white shadow-xl overflow-hidden group-hover:border-blue-400 transition-colors">
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-blue-600">
                  <User className="w-16 h-16 opacity-20" />
                </div>
              )}
            </div>
            <label className="absolute bottom-1 -right-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition active:scale-90 border-4 border-white">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            {formData.profile_picture && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, profile_picture: null })}
                className="absolute bottom-1 -left-2 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition active:scale-90 border-4 border-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{formData.profile_picture ? 'Update Photo' : 'Upload Photo'}</p>
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <h2 className="text-4xl font-black text-gray-900 leading-tight italic uppercase tracking-tighter">
            {formData.name || 'Your Profile'}
          </h2>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100/50">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-tight">{formData.city || 'Location not set'}</span>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Verified Player</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><User className="w-4 h-4" /></div>
            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Account Basics</h3>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Full Display Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Phone Number</label>
              <div className="relative">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl text-green-600"><MapIcon className="w-4 h-4" /></div>
            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Your Area</h3>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Province</label>
              <select name="province" value={formData.province} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition appearance-none cursor-pointer">
                <option value="">Select Province</option>
                {Object.keys(sriLankaData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">District</label>
              <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.province} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition appearance-none cursor-pointer disabled:opacity-50">
                <option value="">Select District</option>
                {formData.province && Object.keys(sriLankaData[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Town / City</label>
              <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.district} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none transition appearance-none cursor-pointer disabled:opacity-50">
                <option value="">Select Town</option>
                {formData.province && formData.district && sriLankaData[formData.province][formData.district].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col items-center gap-4 py-6">
          {error && <p className="text-red-500 text-xs font-bold bg-red-50 border border-red-100 px-6 py-4 rounded-2xl w-full text-center animate-shake">{error}</p>}
          {success && <p className="text-green-600 text-xs font-bold bg-green-50 border border-green-100 px-6 py-4 rounded-2xl w-full text-center animate-fadeIn">{success}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="group w-full md:w-auto min-w-[280px] py-4.5 bg-gray-900 hover:bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-300"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
            {loading ? 'Synchronizing...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
