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
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        
        {/* Profile Picture / Avatar Logic */}
        <div className="relative group z-10 shrink-0">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-4xl font-black shadow-lg overflow-hidden border-4 border-white">
            {formData.profile_picture ? (
              <img src={formData.profile_picture} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              formData.name?.[0] || 'O'
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2.5 bg-green-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition border-4 border-white">
            <Camera className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          {formData.profile_picture && (
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, profile_picture: null })}
              className="absolute -bottom-2 -left-2 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition border-4 border-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-black text-gray-900 leading-tight italic uppercase tracking-tighter">{formData.indoor_name || 'My Facility'}</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-60">Managed by {formData.name}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100 shadow-sm">
              <Mail className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-gray-700">{formData.email}</span>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100 shadow-sm">
              <Phone className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-gray-700">{formData.phone || 'Phone not set'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Personal Information</h3>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:border-green-500 outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:border-green-500 outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:border-green-500 outline-none transition" />
            </div>
          </div>
        </div>

        {/* Indoor Facility Details */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Facility Details</h3>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Indoor/Facility Name</label>
              <input type="text" name="indoor_name" value={formData.indoor_name} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none transition" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Province</label>
                <input type="text" name="province" value={formData.province} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none transition" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">District</label>
                <input type="text" name="district" value={formData.district} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none transition" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">City</label>
              <input type="text" name="city" value={formData.city} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none transition" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2 flex flex-col items-center gap-4 py-4">
          {error && <p className="text-red-600 text-sm font-bold bg-red-50 border border-red-100 px-6 py-3 rounded-2xl w-full text-center animate-shake">{error}</p>}
          {success && <p className="text-green-600 text-sm font-bold bg-green-50 border border-green-100 px-6 py-3 rounded-2xl w-full text-center animate-fadeIn">{success}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto min-w-[240px] py-4 bg-gray-900 bg-gradient-to-r from-gray-900 to-black hover:from-green-600 hover:to-green-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            {loading ? 'Saving Changes...' : 'Update Profile'}
          </button>
        </div>
      </form>

      {/* Security Info Placeholder */}
      <div className="bg-yellow-50/50 border border-yellow-100/50 rounded-[2rem] p-6 flex items-start gap-4">
        <Shield className="w-6 h-6 text-yellow-600 shrink-0 mt-1" />
        <div>
          <p className="text-sm font-black text-yellow-800 uppercase tracking-tighter">Account Security</p>
          <p className="text-xs text-yellow-700 font-medium mt-1 leading-relaxed">To change your password or security settings, please contact support. All changes are logged for security purposes.</p>
        </div>
      </div>
    </div>
  );
}
