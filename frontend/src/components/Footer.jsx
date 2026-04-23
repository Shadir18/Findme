import { Target, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A0F1C] border-t border-white/10 text-white py-14 px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-black tracking-tight">FIND ME</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">The smartest way to find indoor sports teammates in Sri Lanka. No more cancelled games.</p>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Quick Links</h4>
          <ul className="text-slate-400 text-sm space-y-3">
            <li className="hover:text-indigo-300 transition-colors cursor-pointer">Privacy Policy</li>
            <li className="hover:text-indigo-300 transition-colors cursor-pointer">Terms of Service</li>
            <li className="hover:text-indigo-300 transition-colors cursor-pointer">Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Contact</h4>
          <div className="space-y-3 text-slate-400 text-sm">
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> support@findme.lk</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> Colombo, Sri Lanka</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 mt-10 pt-8 text-center text-slate-500 text-xs font-bold tracking-widest uppercase">
        © 2026 Find Me Project - London Metropolitan University.
      </div>
    </footer>
  );
}