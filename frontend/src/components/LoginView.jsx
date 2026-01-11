import { useState } from 'react';

export default function LoginView({ onAuthSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onAuthSuccess(data.user);
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Backend not running! Start your Flask app.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {/* Decorative Internal Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Sign <span className="text-blue-500">In</span></h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Welcome back to FindMe</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <input 
              type="email" required placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" required placeholder="Password"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02]">
              LOGIN
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Don't have an account? <button onClick={onSwitchToSignup} className="text-blue-400 font-bold hover:underline ml-1">Create one</button>
          </p>
        </div>
      </div>
    </div>
  );
}