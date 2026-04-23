import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';

const lbl = 'block text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1';
const inp = 'w-full px-5 py-4 bg-[#0A0F1C]/80 border-2 border-white/10 hover:border-white/20 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:bg-[#0A0F1C] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-300 shadow-inner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('user');
        sessionStorage.setItem('user', JSON.stringify(data));

        if (data.role === 'turf_owner') {
          navigate('/owner-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 animate-fadeIn relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#0A0F1C] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">

          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 p-10 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4 ring-1 ring-indigo-500/40">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-slate-400 mt-2 text-sm font-medium">
                Sign in to your squad
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8 sm:p-10">
            {error && (
              <div className="bg-rose-500/10 text-rose-300 p-4 rounded-2xl mb-6 text-sm text-center font-bold border border-rose-500/30 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={lbl}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="player@findme.lk"
                  className={inp}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className={lbl}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className={inp}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end -mt-2">
                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white disabled:opacity-70 text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-4 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Don't have an account yet?</p>
              <Link
                to="/signup"
                className="text-indigo-400 font-black hover:text-indigo-300 transition-colors uppercase tracking-wider text-xs inline-flex items-center gap-1"
              >
                Create Your Profile <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}