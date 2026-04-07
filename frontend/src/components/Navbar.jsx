import { Link } from 'react-router-dom';

export default function Navbar() {
  // Check the browser's vault to see if a user is logged in
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm py-4 px-8 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-black text-blue-600 italic tracking-tighter">FIND ME</Link>
      
      <div className="space-x-6 font-medium text-gray-600 flex items-center">
        <Link to="/" className="hover:text-blue-600 transition">Home</Link>
        <Link to="/find-match" className="hover:text-blue-600 transition">Find a Match</Link>
        
        {user ? (
          <div className="flex items-center space-x-4 border-l pl-6 ml-2 border-gray-300">
            {/* Show Dashboard link only for players */}
            {user.role === 'player' && (
              <Link
                to="/dashboard"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-bold text-sm"
              >
                My Dashboard
              </Link>
            )}
            <span className="text-blue-600 font-bold">Hi, {user.name}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 transition">Logout</button>
          </div>
        ) : (
          <div className="flex items-center space-x-4 border-l pl-6 ml-2 border-gray-300">
            <Link to="/login" className="hover:text-blue-600 transition">Log In</Link>
            <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}