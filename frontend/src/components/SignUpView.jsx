import { useState } from 'react';

export default function SignUpView({ onAuthSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    dob: '',
    area: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registration successful, moving to OTP...");
        onAuthSuccess(data.user); 
      } else {
        alert(data.error || "Registration Failed");
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert("Could not reach the server. Please check if Flask is running.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] py-12 px-4 relative">
      <div className="w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">JOIN THE <span className="text-blue-500">SQUAD</span></h2>
            <p className="text-slate-500 text-sm mt-1 font-medium text-center">Create your elite athlete profile</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Full Name</label>
              <input type="text" required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Phone</label>
                <input type="tel" required placeholder="07XXXXXXXX" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Birthday</label>
                <input type="date" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-slate-400 outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Living Area</label>
              <input type="text" required placeholder="e.g. Colombo 07" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                onChange={(e) => setFormData({...formData, area: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Email</label>
              <input type="email" required placeholder="name@example.com" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Password</label>
                <input type="password" required placeholder="••••••••" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Confirm</label>
                <input type="password" required placeholder="••••••••" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 mt-4 uppercase">
              Register Now
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Already a member? <button onClick={onSwitchToLogin} className="text-blue-400 font-bold hover:underline ml-1">Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
}