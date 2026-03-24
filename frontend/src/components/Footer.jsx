export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-8 mt-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Find Me</h3>
          <p className="text-gray-400">The smartest way to find indoor sports teammates in Sri Lanka. No more cancelled games.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="text-gray-400 space-y-2">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <p className="text-gray-400">Email: support@findme.lk</p>
          <p className="text-gray-400">Location: Colombo, Sri Lanka</p>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
        © 2026 Find Me Project - London Metropolitan University.
      </div>
    </footer>
  );
}