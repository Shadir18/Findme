import { useState } from 'react';

export default function RegistrationForm({ onPlayerAdded }) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Futsal');
  const [city, setCity] = useState('Colombo');                  // NEW
  const [timeSlot, setTimeSlot] = useState('Saturday Morning'); // NEW
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/add_player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // NEW: We are now sending all 4 pieces of data to Python
        body: JSON.stringify({ name, sport, city, time_slot: timeSlot }),
      });
      const data = await response.json();
      if (data.message) {
        setStatus("✅ You are in the matchmaking pool!");
        setName('');
        onPlayerAdded(); 
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus("❌ Error connecting to server");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-12 border border-gray-100">
      <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Join the Waitlist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name Input */}
        <input 
          type="text" placeholder="Your Name" value={name}
          onChange={(e) => setName(e.target.value)} required 
          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        
        {/* Sport Dropdown */}
        <select 
          value={sport} onChange={(e) => setSport(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
        >
          <option value="Futsal">Futsal</option>
          <option value="Badminton">Badminton</option>
          <option value="Indoor Cricket">Indoor Cricket</option>
        </select>

        {/* NEW: City Dropdown */}
        <select 
          value={city} onChange={(e) => setCity(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
        >
          <option value="Colombo">Colombo</option>
          <option value="Gampaha">Gampaha</option>
          <option value="Kandy">Kandy</option>
          <option value="Galle">Galle</option>
        </select>

        {/* NEW: Time Slot Dropdown */}
        <select 
          value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
        >
          <option value="Weekday Evening (6PM - 9PM)">Weekday Evening (6PM - 9PM)</option>
          <option value="Saturday Morning (8AM - 12PM)">Saturday Morning (8AM - 12PM)</option>
          <option value="Saturday Evening (5PM - 9PM)">Saturday Evening (5PM - 9PM)</option>
          <option value="Sunday Morning (8AM - 12PM)">Sunday Morning (8AM - 12PM)</option>
        </select>

        <button type="submit" className="w-full bg-blue-600 text-white font-bold rounded-lg py-3 hover:bg-blue-700 transition shadow-md">
          Find Me a Squad
        </button>
      </form>
      {status && <p className="mt-4 text-center font-bold text-green-600">{status}</p>}
    </div>
  );
}