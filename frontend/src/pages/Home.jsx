import { Link } from 'react-router-dom';
import { Zap, MapPin, Bell, Trophy, CheckCircle2, Activity, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="animate-fadeIn font-sans text-slate-200">

      {/* 1. HERO SECTION */}
      <section className="relative py-28 px-8 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 ring-1 ring-white/10 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Sri Lanka's Smart Sports Network</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white">
            Stop Searching.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Start Playing.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The first intelligent matchmaking platform for indoor sports. We connect solo players to form squads, and help turf owners fill their empty slots.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/find-match" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]">
              Join as a Player
            </Link>
            <Link to="/signup" className="bg-white/5 text-white ring-1 ring-white/20 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:ring-white/30 transition active:scale-[0.98]">
              Register a Turf
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM WE SOLVE */}
      <section className="py-20 px-8 max-w-4xl mx-auto text-center relative z-10">
        <div className="bg-white/[0.04] backdrop-blur-2xl p-10 md:p-14 rounded-[2.5rem] ring-1 ring-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">Why use Find Me?</h2>
          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We know the struggle. You want to play Futsal or Badminton, but your friends are busy. You message WhatsApp groups, wait for replies, and eventually, the plan gets cancelled.
            <br /><br />
            <strong className="text-indigo-300">Find Me</strong> eliminates the hassle. Tell us what you play and when you are free, and our algorithm instantly matches you with others in your city.
          </p>
        </div>
      </section>

      {/* 3. SERVICES FOR PLAYERS */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">Player Features</p>
            <h2 className="text-4xl font-black text-white tracking-tight">For Solo Players</h2>
            <p className="text-slate-400 mt-3 text-lg font-medium">Everything you need to get in the game.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-8 h-8" />, title: 'Smart Matching', desc: 'Our algorithm automatically groups you into balanced teams based on your preferred sport, availability, and location.' },
              { icon: <MapPin className="w-8 h-8" />, title: 'Local Squads', desc: 'Whether you are in Colombo, Gampaha, or Kandy, we find players near you to minimize travel time.' },
              { icon: <Bell className="w-8 h-8" />, title: 'Instant Alerts', desc: 'Get notified the second a squad is formed so you can confirm your spot and head to the court.' },
            ].map((card, i) => (
              <div key={i} className="group bg-white/[0.04] backdrop-blur-2xl p-8 rounded-[2rem] ring-1 ring-white/10 hover:ring-indigo-500/40 transition-all duration-500 hover:-translate-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.25)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-6 ring-1 ring-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SUBSTITUTE FINDER */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-[2.5rem] p-10 md:p-14 ring-1 ring-amber-500/30 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/40">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">Teammate cancelled last minute?</h2>
              <p className="text-base text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
                Don't lose your booking! If someone drops out, our <strong className="text-amber-300">Live Substitute Finder</strong> lets your team instantly broadcast your open spot to available solo players ready to jump in.
              </p>
              <Link to="/find-match" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98]">
                Find a Fill-In Player
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES FOR TURF OWNERS */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">Owner Features</p>
            <h2 className="text-4xl font-black text-white tracking-tight">For Facility Owners</h2>
            <p className="text-slate-400 mt-3 text-lg font-medium">Maximize your court bookings with zero manual effort.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="space-y-5">
              {[
                { title: 'Fill Empty Slots', desc: 'Our system directs newly formed, ready-to-play squads directly to your available court times.' },
                { title: 'Digital Booking Management', desc: 'Replace your paper ledger. Manage your turf schedule through our clean, easy-to-use digital dashboard.' },
                { title: 'Increased Visibility', desc: 'Get discovered by hundreds of local players who are actively looking for a place to play right now.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/[0.04] backdrop-blur-2xl p-6 rounded-[2rem] ring-1 ring-white/10 hover:ring-emerald-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/40 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-white tracking-tight mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/[0.04] backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 ring-1 ring-white/10 text-center flex flex-col justify-center shadow-[0_8px_30px_rgb(0,0,0,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/40">
                  <Activity className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Partner With Us</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto">Join the Find Me network today and let our matching algorithm bring the players directly to your doorstep.</p>
                <Link to="/signup" className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-[0.98] text-sm uppercase tracking-widest">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">Simple Process</p>
            <h2 className="text-4xl font-black text-white tracking-tight">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Sign Up', desc: 'Create a free profile and select your favorite indoor sports.' },
              { num: '2', title: 'Set Availability', desc: 'Tell us when and where you are free to play this week.' },
              { num: '3', title: 'Get Matched', desc: 'Our system forms a squad and recommends a turf. Just show up and play!' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl font-black mx-auto mb-6 ring-1 ring-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  {step.num}
                </div>
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] p-10 md:p-14 text-center overflow-hidden shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] ring-1 ring-white/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-6 ring-1 ring-white/30">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Ready to Play?</h2>
              <p className="text-indigo-100 text-base mb-10 max-w-md mx-auto">Join thousands of players across Sri Lanka. Your next squad is waiting.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/signup" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-[0.98]">
                  Create Free Account
                </Link>
                <Link to="/find-match" className="bg-white/10 text-white ring-1 ring-white/30 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition active:scale-[0.98]">
                  Explore Matches
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}