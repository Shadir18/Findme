import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="animate-fadeIn font-sans text-gray-800">

      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-24 px-8 text-center shadow-inner">
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          Stop Searching. <span className="text-yellow-300">Start Playing.</span>
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 font-light">
          Sri Lanka's first smart matchmaking platform for indoor sports. We connect solo players to form squads, and help turf owners fill their empty slots.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/find-match" className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg transform hover:-translate-y-1">
            Join as a Player
          </Link>
          <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition shadow-lg">
            Register a Turf (Coming Soon)
          </button>
        </div>
      </section>

      {/* 2. THE PROBLEM WE SOLVE */}
      <section className="py-16 px-8 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Why use Find Me?</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          We know the struggle. You want to play Futsal or Badminton, but your friends are busy. You message WhatsApp groups, wait for replies, and eventually, the plan gets cancelled.
          <br /><br />
          <strong>Find Me</strong> eliminates the hassle. Tell us what you play and when you are free, and our algorithm instantly matches you with others in your city.
        </p>
      </section>

      {/* 3. SERVICES FOR PLAYERS */}
      <section className="bg-gray-50 py-20 px-8 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-600">For Solo Players</h2>
            <p className="text-gray-500 mt-2 text-lg">Everything you need to get in the game.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Smart Matching</h3>
              <p className="text-gray-600">Our algorithm automatically groups you into balanced teams based on your preferred sport, availability, and location.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3">Local Squads</h3>
              <p className="text-gray-600">Whether you are in Colombo, Gampaha, or Kandy, we find players near you to minimize travel time.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-xl font-bold mb-3">Instant Alerts</h3>
              <p className="text-gray-600">Get notified the second a squad is formed so you can confirm your spot and head to the court.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEW: THE SUBSTITUTE FINDER (For Teams) */}
      <section className="bg-yellow-400 py-16 px-8 text-gray-900 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-4xl font-black mb-6">Teammate cancelled last minute?</h2>
          <p className="text-xl font-medium mb-8 max-w-2xl mx-auto">
            Don't lose your booking! If someone drops out 1 day before or right before the game, our <strong>Live Substitute Finder</strong> lets your team instantly broadcast your open spot to available solo players ready to jump in.
          </p>
          <Link to="/find-match" className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition shadow-lg inline-block transform hover:-translate-y-1">
            Find a Fill-In Player
          </Link>
        </div>
      </section>

      {/* 5. SERVICES FOR TURF OWNERS */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-green-600">For Facility Owners</h2>
            <p className="text-gray-500 mt-2 text-lg">Maximize your court bookings with zero manual effort.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-4 text-2xl">✔</span>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800">Fill Empty Slots</h4>
                    <p className="text-gray-600">Our system directs newly formed, ready-to-play squads directly to your available court times.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-4 text-2xl">✔</span>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800">Digital Booking Management</h4>
                    <p className="text-gray-600">Replace your paper ledger. Manage your turf schedule through our clean, easy-to-use digital dashboard.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-4 text-2xl">✔</span>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800">Increased Visibility</h4>
                    <p className="text-gray-600">Get discovered by hundreds of local players who are actively looking for a place to play right now.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center shadow-inner">
              <div className="text-8xl mb-4">🏟️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Partner With Us</h3>
              <p className="text-gray-600 mb-6">Join the Find Me network today and let our matching algorithm bring the players directly to your doorstep.</p>
              <button className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
                Learn More (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="bg-blue-900 text-white py-20 px-8 text-center">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-2 border-blue-400">1</div>
            <h3 className="text-xl font-bold mb-2">Sign Up</h3>
            <p className="text-blue-200">Create a free profile and select your favorite indoor sports.</p>
          </div>
          <div>
            <div className="bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-2 border-blue-400">2</div>
            <h3 className="text-xl font-bold mb-2">Set Availability</h3>
            <p className="text-blue-200">Tell us when and where you are free to play this week.</p>
          </div>
          <div>
            <div className="bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-2 border-blue-400">3</div>
            <h3 className="text-xl font-bold mb-2">Get Matched</h3>
            <p className="text-blue-200">Our system forms a squad and recommends a turf. Just show up and play!</p>
          </div>
        </div>
      </section>

    </div>
  );
}