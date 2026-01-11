import { useState } from 'react';

export default function OTPView({ phone, onVerifySuccess }) {
  const [otp, setOtp] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    // For your university demo, we will use '123456' as the universal code
    if (otp === '123456') {
      onVerifySuccess();
    } else {
      alert("Invalid Verification Code. Please use 123456 for this demo.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 relative">
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center">
        
        {/* Internal Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Verify <span className="text-blue-500">Phone</span>
          </h2>
          <p className="text-slate-500 text-sm mt-4 font-medium">
            We sent a 6-digit code to your mobile
          </p>
          <p className="text-blue-400 font-bold tracking-widest mt-1">{phone}</p>

          <form onSubmit={handleVerify} className="mt-10 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                Enter OTP Code
              </label>
              
              {/* FIXED INPUT COMPONENT */}
              <input 
                type="text" 
                required 
                maxLength="6" 
                placeholder="000000"
                autoFocus
                className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-center text-4xl font-mono font-black tracking-[0.6em] text-blue-500 outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800 placeholder:tracking-[0.6em]"
                onChange={(e) => setOtp(e.target.value)}
              />
              
              <p className="text-[9px] text-slate-600 italic">
                Demo code: <span className="text-blue-400/50">123456</span>
              </p>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest">
              Verify & Register
            </button>
          </form>

          <div className="mt-8 flex justify-between items-center px-2">
            <button type="button" className="text-[10px] font-bold text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Resend SMS</button>
            <button type="button" className="text-[10px] font-bold text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Change Number</button>
          </div>
        </div>
      </div>
    </div>
  );
}