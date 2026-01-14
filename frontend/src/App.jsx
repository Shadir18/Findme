import { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import HomeView from './components/HomeView';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';
import OwnerSignUpView from './components/OwnerSignUpView'; 
import ProfileView from './components/ProfileView';
import OwnerDashboard from './components/OwnerDashboard'; // New Import
import OTPView from './components/OTPView';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);
  const [regType, setRegType] = useState('player'); 
  const [tempPhone, setTempPhone] = useState('');
  const [tempPref, setTempPref] = useState(null); 

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Centralized navigation handler
  const handleDiscoveryStart = (type, preferences = null) => {
    setRegType(type);
    if (preferences) setTempPref(preferences);
    
    if (!user) {
      setView('signup'); 
    } else {
      setView('profile'); 
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 w-full z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 h-20 flex justify-between items-center">
        <h1 onClick={() => setView('home')} className="text-2xl font-black italic cursor-pointer tracking-tighter">
          FIND<span className="text-blue-500">ME</span>
        </h1>
        
        <div className="flex gap-4 md:gap-8 items-center">
          <button onClick={() => setView('home')} className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors font-medium">Home</button>
          
          {!user ? (
            <>
              <button onClick={() => setView('login')} className="text-sm font-bold hover:text-blue-400 transition-colors">Login</button>
              <button 
                onClick={() => { setRegType('player'); setView('signup'); }} 
                className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Sign up
              </button>
            </>
          ) : (
            <button 
              onClick={() => setView('profile')} 
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-1 pr-4 rounded-full border border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border border-white/20">
                <span className="text-xs font-black">
                  {(user.full_name || user.name || user.owner_name)?.charAt(0)}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                {user.role === 'owner' ? 'Owner Portal' : (user.full_name || user.name).split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </nav>

      <main className="pt-20">
        {/* VIEW ROUTING LOGIC */}
        {view === 'home' && <HomeView onStart={handleDiscoveryStart} />}
        
        {view === 'login' && (
          <LoginView 
            onAuthSuccess={(userData) => { setUser(userData); setView('profile'); }} 
            onSwitchToSignup={() => setView('signup')} 
          />
        )}
        
        {view === 'signup' && (
          regType === 'player' ? (
            <SignUpView 
              preSelectedPref={tempPref}
              onAuthSuccess={(userData) => {
                setTempPhone(userData.phone);
                setUser(userData); 
                setView('otp'); 
              }} 
              onSwitchToLogin={() => setView('login')} 
            />
          ) : (
            <OwnerSignUpView 
              onAuthSuccess={(userData) => {
                setTempPhone(userData.phone);
                setUser(userData); 
                setView('otp'); 
              }} 
              onSwitchToLogin={() => setView('login')}
            />
          )
        )}

        {view === 'otp' && (
          <OTPView 
            phone={tempPhone} 
            onVerifySuccess={() => setView('profile')} 
          />
        )}

        {view === 'profile' && (
          /* ROLE-BASED DASHBOARD SWITCH */
          user?.role === 'owner' ? (
            <OwnerDashboard 
              user={user} 
              onLogout={() => { setUser(null); setView('home'); }} 
            />
          ) : (
            <ProfileView 
              user={user} 
              onLogout={() => { setUser(null); setView('home'); }} 
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;