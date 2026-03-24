import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Importing all our components and pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import RegistrationForm from './components/RegistrationForm';
import MatchGrid from './components/MatchGrid';

// NEW: Importing your Login and Signup pages!
import Signup from './pages/Signup';
import Login from './pages/Login';

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
    refreshData().then(() => {
      setTimeout(() => setIsLoading(false), 1500);
    });
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="flex-grow">
          {/* THIS IS THE ROUTING SECTION YOU ASKED ABOUT! */}
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route path="/find-match" element={
              <div className="p-8">
                <RegistrationForm onPlayerAdded={refreshData} />
                <MatchGrid matches={matchData} />
              </div>
            } />
            
            <Route path="/about" element={<div className="p-20 text-center text-2xl">About Page Content (Coming Soon)</div>} />
            
            {/* NEW: Login and Signup Routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            
            {/* Catch-All Route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;