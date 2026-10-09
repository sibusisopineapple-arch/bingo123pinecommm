import React, { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export const PineappleMascot: React.FC = () => {
  const [greetIndex, setGreetIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [clickTreat, setClickTreat] = useState(false);

  const greetings = [
    "Welcome to USAP Community School! 🍍✨",
    "Serving you excellence! 😎",
    "Stay sharp & focused on your tests! 🎓",
    "Pineapplemieh is treating you to a great term! 🍍💛",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setGreetIndex((prev) => (prev + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [greetings.length]);

  const handleTreat = () => {
    setClickTreat(true);
    setTimeout(() => setClickTreat(false), 2000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-6 select-none perspective-distant">
      {/* Dynamic 3D Glowing Ambient Halo */}
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/40 via-purple-500/35 to-yellow-400/50 rounded-full blur-2xl animate-pulse pointer-events-none" />

      {/* Speech Bubble with 3D Depth */}
      <div className="relative mb-3 z-10 transition-all duration-300 transform hover:scale-105">
        <div className="bg-gradient-to-r from-amber-50 to-purple-50 border-2 border-amber-300/80 text-amber-950 px-4 py-2 rounded-2xl shadow-xl shadow-amber-500/20 text-xs sm:text-sm font-extrabold flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          <span>{greetings[greetIndex]}</span>
          {clickTreat && <span className="text-purple-600 animate-bounce">✨ Sweet!</span>}
        </div>
        {/* Triangle Tail */}
        <div className="w-3 h-3 bg-amber-50 border-r-2 border-b-2 border-amber-300/80 transform rotate-45 mx-auto -mt-1.5" />
      </div>

      {/* 3D Glowing Pineapple Container */}
      <div
        onClick={handleTreat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer group transition-transform duration-300"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Floating Animation Wrapper */}
        <div className="relative flex flex-col items-center animate-bounce duration-1000">
          {/* Pineapple Leaves / Crown */}
          <div className="relative -mb-3 z-20 flex justify-center filter drop-shadow-[0_4px_10px_rgba(34,197,94,0.6)]">
            <svg width="84" height="60" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Back leaves */}
              <path d="M50 45 C40 25, 20 15, 5 22 C18 10, 42 22, 50 45 Z" fill="#15803d" />
              <path d="M50 45 C60 25, 80 15, 95 22 C82 10, 58 22, 50 45 Z" fill="#15803d" />
              {/* Center upright spikes */}
              <path d="M50 45 C45 20, 40 5, 50 0 C60 5, 55 20, 50 45 Z" fill="#22c55e" />
              <path d="M50 45 C40 25, 25 15, 20 5 C32 12, 45 25, 50 45 Z" fill="#16a34a" />
              <path d="M50 45 C60 25, 75 15, 80 5 C68 12, 55 25, 50 45 Z" fill="#16a34a" />
              {/* Foreground glossy leaves */}
              <path d="M50 45 C42 30, 30 20, 22 18 C35 22, 46 32, 50 45 Z" fill="#4ade80" />
              <path d="M50 45 C58 30, 70 20, 78 18 C65 22, 54 32, 50 45 Z" fill="#4ade80" />
            </svg>
          </div>

          {/* Pineapple Body (3D Textured & Glowing) */}
          <div className="relative w-28 h-36 rounded-[50px/65px] bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 shadow-[0_15px_35px_rgba(245,158,11,0.5),inset_0_-8px_16px_rgba(180,83,9,0.7),inset_0_8px_16px_rgba(254,240,138,0.8)] border-2 border-amber-300/80 overflow-hidden flex items-center justify-center">
            {/* 3D Pineapple Diamond Pattern / Texture */}
            <div className="absolute inset-0 opacity-45 mix-blend-overlay">
              <svg width="100%" height="100%">
                <pattern id="pineapple-grid" width="22" height="22" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <path d="M 0 11 L 22 11 M 11 0 L 11 22" stroke="#78350f" strokeWidth="2.5" fill="none" />
                  <circle cx="11" cy="11" r="2" fill="#fef08a" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#pineapple-grid)" />
              </svg>
            </div>

            {/* Specular 3D Highlight Curve */}
            <div className="absolute top-2 left-3 w-8 h-20 bg-white/40 rounded-full blur-[3px] transform -rotate-15 pointer-events-none" />

            {/* COOL BLACK SHADES (Sunglasses) */}
            <div className="relative z-30 flex items-center justify-center filter drop-shadow-[0_8px_15px_rgba(0,0,0,0.75)] transform -translate-y-2">
              <svg width="92" height="42" viewBox="0 0 100 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sunglasses Top Bridge */}
                <rect x="10" y="8" width="80" height="7" rx="3.5" fill="#09090b" />
                {/* Bridge Nose Connector */}
                <path d="M44 14 Q50 17 56 14" stroke="#18181b" strokeWidth="4" fill="none" />

                {/* Left Lens Frame */}
                <path d="M12 12 H45 C45 26, 40 38, 28 38 C16 38, 12 26, 12 12 Z" fill="#0a0a0a" stroke="#27272a" strokeWidth="2" />
                {/* Left Lens Glass */}
                <path d="M14 14 H43 C43 25, 38 36, 28 36 C18 36, 14 25, 14 14 Z" fill="url(#lensGradient)" />
                {/* Left Glare / Reflection Slant */}
                <path d="M18 15 L32 15 L22 34 L15 34 Z" fill="white" fillOpacity="0.45" />

                {/* Right Lens Frame */}
                <path d="M55 12 H88 C88 26, 84 38, 72 38 C60 38, 55 26, 55 12 Z" fill="#0a0a0a" stroke="#27272a" strokeWidth="2" />
                {/* Right Lens Glass */}
                <path d="M57 14 H86 C86 25, 82 36, 72 36 C62 36, 57 25, 57 14 Z" fill="url(#lensGradient)" />
                {/* Right Glare / Reflection Slant */}
                <path d="M61 15 L75 15 L65 34 L58 34 Z" fill="white" fillOpacity="0.45" />

                <defs>
                  <linearGradient id="lensGradient" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#18181b" />
                    <stop offset="0.6" stopColor="#09090b" />
                    <stop offset="1" stopColor="#27272a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Friendly Confident Smile */}
            <div className="absolute bottom-5 z-20">
              <svg width="34" height="18" viewBox="0 0 34 18">
                <path d="M4 3 Q17 17 30 3" stroke="#78350f" strokeWidth="4" strokeLinecap="round" fill="#b91c1c" />
                <path d="M10 8 Q17 14 24 8" fill="#fecaca" />
              </svg>
            </div>

            {/* Rosy Cheeks */}
            <div className="absolute bottom-7 left-3 w-4 h-2 rounded-full bg-rose-400/60 blur-[1px]" />
            <div className="absolute bottom-7 right-3 w-4 h-2 rounded-full bg-rose-400/60 blur-[1px]" />
          </div>

          {/* Animated Treating / Waving Hands */}
          {/* Left Hand Holding a Sparkling Cocktail/Treat */}
          <div className="absolute -left-7 top-18 z-20 transform -rotate-12 animate-pulse flex items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-300 shadow-md flex items-center justify-center text-sm">
              👋
            </div>
          </div>

          {/* Right Hand Waving or Treating */}
          <div className="absolute -right-7 top-18 z-20 transform rotate-12 transition-transform duration-300 hover:rotate-45 flex items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-300 shadow-md flex items-center justify-center text-sm">
              ✨
            </div>
          </div>
        </div>

        {/* 3D Oval Ground Shadow */}
        <div className="w-24 h-4 bg-slate-800/25 rounded-full mx-auto -mt-1 blur-xs transform scale-x-110" />
      </div>

      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black uppercase tracking-wider shadow-xs">
          Pineapplemieh 🍍
        </span>
      </div>
    </div>
  );
};
