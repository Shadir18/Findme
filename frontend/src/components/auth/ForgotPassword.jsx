import { useState } from 'react';
import { Mail, ShieldCheck, Lock, ChevronRight, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://127.0.0.1:5000';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/forgot-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to send recovery code');
      }
    } catch {
      setError('Connection error. Server may be down.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/reset-password-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password reset successfully!');
        setStep(4); // Success state
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 animate-fadeIn">
      <div className="w-full max-w-md">
        
        {/* Progress Header */}
        <div className="bg-white p-6 rounded-t-[2rem] border-t border-x border-gray-100 flex items-center justify-between px-10 shadow-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>3</div>
        </div>

        <div className="bg-white p-10 rounded-b-[2.5rem] shadow-2xl border-x border-b border-gray-100 relative overflow-hidden">
          {/* Accent Blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          <div className="relative z-10">
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase italic">Forgot Password?</h2>
                  <p className="text-gray-500 text-sm mt-2">Enter your registered email or phone number to receive a recovery code.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email or Phone</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-blue-600 transition-all font-bold text-gray-800"
                      placeholder="e.g. mshadir@findme.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {loading ? 'Sending Code...' : 'Request Recovery Code'}
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase italic">Check Your Inbox</h2>
                  <p className="text-gray-500 text-sm mt-2">We've sent a 6-digit code to <span className="font-bold text-blue-600">{email}</span></p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Verification Code</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    required 
                    className="w-full px-5 py-5 rounded-2xl border-2 border-gray-100 outline-none focus:border-blue-600 transition-all font-black text-3xl text-center tracking-[10px] text-blue-600"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Verify Identity
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600">Wrong email? Go back</button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase italic">Reset Password</h2>
                  <p className="text-gray-500 text-sm mt-2">Choose a strong new password that you haven't used before.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">New Password</label>
                    <input 
                      type="password" 
                      required 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-blue-600 transition-all font-bold text-gray-800"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-blue-600 transition-all font-bold text-gray-800"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {loading ? 'Resetting...' : 'Change Password Permanently'}
                </button>
              </form>
            )}

            {step === 4 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase italic mb-2">Password Updated!</h2>
                <p className="text-gray-500 text-sm mb-8 px-4">Your account is now secure. You can log in with your new password.</p>
                <Link 
                  to="/login" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  Log In Now
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/login" className="text-gray-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-widest text-[10px]">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
