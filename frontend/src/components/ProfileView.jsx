import { useState, useEffect } from 'react';

export default function ProfileView({ user, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New States for Profile Photo
  const [profilePhoto, setProfilePhoto] = useState(user.profile_photo || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/players?area=${user.area}`);
        const data = await response.json();
        setPlayers(data);
        setLoading(false);
      } catch (err) {
        console.error("Discovery fetch error:", err);
        setLoading(false);
      }
    };

    if (user && user.area) {
      fetchPlayers();
    }
  }, [user]);

  // Handle Photo Upload and Conversion to Base64
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result;
      setIsUploading(true);

      try {
        const response = await fetch('http://127.0.0.1:5000/api/user/update-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, image: base64String }),
        });

        if (response.ok) {
          setProfilePhoto(base64String);
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setIsUploading(false);
      }
    };
  };

  // Handle Photo Removal
  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove profile photo?")) return;
    try {
      const response = await fetch('http://127.0.0.1:5000/api/user/remove-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (response.ok) setProfilePhoto(null);
    } catch (err) {
      console.error("Removal failed", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-6 pb-20 selection:bg-blue-500/30">
      
      {/* SECTION 1: ELEGANT HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 mb-10 shadow-2xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* PROFILE PHOTO WITH EDIT/REMOVE OVERLAY */}
          <div className="relative group">
            <div className="w-40 h-40 bg-white/20 backdrop-blur-md rounded-[2.5rem] border border-white/30 flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl font-black text-white drop-shadow-lg">
                  {user.full_name?.charAt(0) || 'U'}
                </span>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                <label className="cursor-pointer bg-white/20 hover:bg-white/40 px-4 py-2 rounded-full transition-all border border-white/20">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Edit</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
                {profilePhoto && (
                  <button onClick={handleRemovePhoto} className="text-red-400 text-[9px] font-black uppercase tracking-widest hover:text-red-300 transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Uploading Spinner */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-600/40 backdrop-blur-md rounded-[2.5rem] z-20">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase drop-shadow-md">
              {user.full_name}
            </h2>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              <span className="bg-black/20 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                {user.area}
              </span>
              <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-green-500/30">
                Verified Athlete
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="md:ml-auto bg-black/20 hover:bg-red-500/40 px-10 py-4 rounded-2xl text-[11px] font-black transition-all border border-white/10 uppercase tracking-[0.2em] active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* SECTION 2: PLAYER DATA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.05] transition-colors">
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Email Id</p>
          <p className="text-white font-semibold tracking-tight">{user.email}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.05] transition-colors">
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Mobile Identity</p>
          <p className="text-white font-semibold tracking-tight">{user.phone}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.05] transition-colors">
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Born Date</p>
          <p className="text-white font-semibold tracking-tight">{user.dob}</p>
        </div>
      </div>

      {/* SECTION 3: SQUAD DISCOVERY FEED */}
      <div className="mb-10 px-4">
        <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase">
          Elite <span className="text-blue-500">Squads</span> Nearby
        </h3>
        <p className="text-slate-500 text-sm font-medium mt-1">Showing active players in the {user.area} region</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-3 text-center py-20 animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing with match server...</div>
        ) : players.length > 0 ? (
          players.map((p, idx) => (
            <div key={idx} className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] hover:border-blue-500/40 transition-all group relative overflow-hidden">
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-3xl border border-blue-500/20 shadow-lg">
                  {p.sport?.charAt(0) || 'S'}
                </div>
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-5 py-2 rounded-full uppercase tracking-widest border border-blue-500/20">
                  {p.skill_level || 'Elite'}
                </span>
              </div>
              
              <h4 className="text-white font-black text-2xl tracking-tighter mb-1">{p.name}</h4>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">{p.sport}</p>
              
              <button className="w-full bg-blue-600 hover:bg-blue-500 py-4.5 rounded-[1.2rem] text-[11px] font-black text-white transition-all uppercase tracking-[0.3em] shadow-xl shadow-blue-600/10 active:scale-95">
                Join Squad
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-white/[0.01] border border-dashed border-white/10 p-24 rounded-[3.5rem] text-center">
            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-sm mb-2 italic">Scanning Area...</p>
            <p className="text-slate-700 font-medium">No available squads matching your current location.</p>
          </div>
        )}
      </div>
    </div>
  );
}