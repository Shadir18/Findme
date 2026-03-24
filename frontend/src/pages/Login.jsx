import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        // Save the user data to the browser's vault
        localStorage.setItem('user', JSON.stringify(data));
        // Force a hard reload to update the Navbar and go to Home
        window.location.href = '/'; 
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 animate-fadeIn">
      {/* Login Container */}
      <div className="w-full max-w-md">
        
        {/* Card Header (Matching your Hero gradient) */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-t-[2.5rem] p-10 text-center shadow-lg relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight italic uppercase">
            Sign <span className="text-yellow-300">In</span>
          </h2>
          <p className="text-blue-100 mt-2 font-light">
            Back to the squad. Ready to play?
          </p>
        </div>

        {/* Form Body */}
        <div className="bg-white p-10 rounded-b-[2.5rem] shadow-xl border-x border-b border-gray-100 -mt-2">
          
          {/* Error Message Display */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-bold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="player@findme.lk"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all text-gray-800 placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-900 mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all text-gray-800 placeholder:text-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-lg transform hover:-translate-y-1 active:scale-95"
            >
              LOGIN TO FINDME
            </button>
          </form>

          {/* Footer Action */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-2">Don't have an account yet?</p>
            {/* Note: I changed your button to a React Router <Link> so it correctly routes to the signup page! */}
            <Link 
              to="/signup" 
              className="text-blue-700 font-black hover:text-blue-500 transition-colors uppercase tracking-wider text-sm inline-block"
            >
              Create Your Player Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}