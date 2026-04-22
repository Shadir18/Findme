import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Shield, ChevronRight, Save, Camera, Trash2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

export default function ProfileSection({ user, fetchDashboardData }) {
  const cleanVal = (val) => {
    if (!val || typeof val !== 'string') return val;
    // Remove common corruption artifacts from previous registration bugs
    return val.split("'")[0].split(":")[0].trim();
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: cleanVal(user?.phone || user?.mobile || user?.user_phone || ''),
    indoor_name: cleanVal(user?.indoor_name || user?.turf_name || user?.facility_name || ''),
    province: cleanVal(user?.province || user?.address?.province || ''),
    district: cleanVal(user?.district || user?.address?.district || ''),
    city: cleanVal(user?.city || user?.town || user?.address?.town || ''),
    profile_picture: user?.profile_picture || null
  });

  // Keep form in sync with user prop updates
  useEffect(() => {
    if (user) {
      console.log("OWNER_PROFILE_SYNC:", user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: cleanVal(user.phone || user.mobile || user.user_phone || ''),
        indoor_name: cleanVal(user.indoor_name || user.turf_name || user.facility_name || ''),
        province: cleanVal(user.province || user.address?.province || ''),
        district: cleanVal(user.district || user.address?.district || ''),
        city: cleanVal(user.city || user.town || user.address?.town || ''),
        profile_picture: user.profile_picture || null
      });
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      reader.onloadend = () => setFormData({ ...formData, profile_picture: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("User session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

    const payload = {
      ...formData,
      owner_id: user._id || user.id
    };

    console.log("UPDATING_PROFILE_PAYLOAD:", payload);

    try {
      const res = await fetch(`${API}/api/owner/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("UPDATE_RESPONSE:", data);

      if (data.success) {
        setSuccess('Profile updated successfully!');
        sessionStorage.setItem('user', JSON.stringify(data.user));
        if (fetchDashboardData) fetchDashboardData(data.user._id || data.user.id);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error("PROFILE_UPDATE_ERROR:", err);
      setError('Connection error. Server may be down.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Profile Summary */}
      <div className="bg-white/[0.04] backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

        {/* Profile Picture / Avatar Logic */}
        <div className="relative group z-10 shrink-0">
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-lg overflow-hidden ring-4 ring-[#0A0F1C]">
            {formData.profile_picture ? (
              <img src={formData.profile_picture} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              formData.name?.[0] || 'O'
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-indigo-400 transition ring-4 ring-[#0A0F1C]">
            <Camera className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          {formData.profile_picture && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, profile_picture: null })}
              className="absolute -bottom-2 -left-2 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-400 transition ring-4 ring-[#0A0F1C]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-black text-white leading-tight italic uppercase tracking-tighter drop-shadow-md">{formData.indoor_name || 'My Facility'}</h1>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-1.5 opacity-80">Managed by {formData.name}</p>
          <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-white/5 px-4 py-2.5 rounded-xl flex items-center gap-3 ring-1 ring-white/10 shadow-sm">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-slate-300">{formData.email}</span>
            </div>
            <div className="bg-white/5 px-4 py-2.5 rounded-xl flex items-center gap-3 ring-1 ring-white/10 shadow-sm">
              <Phone className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-slate-300">{formData.phone || 'Phone not set'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Card */}
        <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 overflow-hidden">
          <div className="bg-white/5 px-8 py-6 border-b border-white/5 flex items-center gap-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Personal Information</h3>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#0A0F1C] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#0A0F1C] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#0A0F1C] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition shadow-inner" />
            </div>
          </div>
        </div>

        {/* Indoor Facility Details */}
        <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] ring-1 ring-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-white/[0.01] pointer-events-none"></div>
          <div className="bg-white/5 px-8 py-6 border-b border-white/5 flex items-center gap-3 relative z-10">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Facility Details</h3>
          </div>
          <div className="p-8 space-y-6 relative z-10">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Indoor/Facility Name</label>
              <input type="text" name="indoor_name" value={formData.indoor_name} readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed outline-none transition opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Province</label>
                <input type="text" name="province" value={formData.province} readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed outline-none transition opacity-70" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">District</label>
                <input type="text" name="district" value={formData.district} readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed outline-none transition opacity-70" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">City</label>
              <input type="text" name="city" value={formData.city} readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed outline-none transition opacity-70" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2 flex flex-col items-center gap-5 py-6">
          {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl w-full text-center animate-shake backdrop-blur-md">{error}</p>}
          {success && <p className="text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl w-full text-center animate-fadeIn backdrop-blur-md">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto min-w-[280px] py-4 bg-white text-[#0A0F1C] hover:bg-indigo-400 hover:text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-[#0A0F1C]/20 border-t-[#0A0F1C] rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            {loading ? 'Saving Changes...' : 'Update Profile'}
          </button>
        </div>
      </form>

      {/* Security Info Placeholder */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex items-start gap-4 ring-1 ring-amber-500/10">
        <Shield className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
        <div>
          <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Account Security</p>
          <p className="text-xs text-amber-500/80 font-medium mt-1.5 leading-relaxed">To change your password or security settings, please contact support. All changes are logged for security purposes.</p>
        </div>
      </div>
    </div>
  );
}
