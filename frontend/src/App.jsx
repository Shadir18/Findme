import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Importing all our components and pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import RegistrationForm from './components/RegistrationForm';
import MatchGrid from './components/MatchGrid';

// Importing your Login and Signup pages!
import Signup from './pages/Signup';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import PlayersDashboard from './pages/PlayersDashboard';
import ForgotPassword from './components/auth/ForgotPassword';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [matchData, setMatchData] = useState({});

  const refreshData = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/matches');
      const data = await res.json();
      setMatchData(data);
    } catch (e) { console.error("Fetch failed"); }
  };

  useEffect(() => {
    // Resolve loading regardless of backend status
    refreshData().catch(() => {}).finally(() => {
      setTimeout(() => setIsLoading(false), 800);
    });
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        {/* ── Standalone routes – own full-screen layouts ─────────────────── */}
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/dashboard" element={<PlayersDashboard />} />

        {/* ── Standard layout routes – shared Navbar / Footer ─────────────── */}
        <Route path="/*" element={
          <div className="flex flex-col min-h-screen bg-[#030712] font-sans text-slate-200">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`body{font-family:'Outfit',sans-serif; background-color: #030712;}`}</style>
            <Navbar />
            <main className="flex-grow relative overflow-hidden">
              {/* Global ambient orbs for public pages */}
              <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>
              <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_8s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
              <div className="relative z-10">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/find-match" element={
                    <div className="p-8">
                      <RegistrationForm onPlayerAdded={refreshData} />
                      <MatchGrid matches={matchData} />
                    </div>
                  } />
                  <Route path="/about" element={<div className="p-20 text-center text-2xl text-slate-300">About Page Content (Coming Soon)</div>} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;