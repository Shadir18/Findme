import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      
      {/* Background Ambient Glows - Adds Depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative flex flex-col items-center">
        
        {/* Branding & Status */}
        <div className="mt-10 text-center">
          <h1 className="text-7xl font-black mb-6 tracking-tighter text-white italic">
            FIND<span className="text-blue-500">ME</span>
          </h1>
          <p className="mt-5 text-[10px] font-bold tracking-[0.6em] text-blue-400/60 uppercase">
            find your strange squad 
          </p>
        </div>

        {/* Elegant Progress Line */}
        <div className="mt-5 w-100 h-[1px] bg-slate-800 rounded-full relative overflow-hidden">
          <div className="absolute h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent w-full animate-loading-bar"></div>
        </div>
      </div>

      <div className="absolute bottom-5 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
        Connecting to Server...
      </div>
    </div>
  );
}
