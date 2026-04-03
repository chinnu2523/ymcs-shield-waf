import React from "react";
import { Globe, MapPin } from "lucide-react";

/**
 * ThreatMap provides a visual representation of attack origins.
 * Plotted dynamically onto a Global SVG via country correlation or IP-based heuristic positioning.
 */
export default function ThreatMap({ threats }) {
  // Global Geolocation Projection Baseline
  const countryCoords = {
    "US": { x: 80, y: 50 },
    "IN": { x: 260, y: 70 },
    "RU": { x: 280, y: 35 },
    "CN": { x: 300, y: 60 },
    "BR": { x: 130, y: 100 },
    "GB": { x: 185, y: 40 },
    "DE": { x: 200, y: 40 },
    "FR": { x: 195, y: 45 },
    "JP": { x: 340, y: 55 },
    "KP": { x: 325, y: 55 }
  };

  // Heuristic coordinate generator for dynamic real-time IP plotting
  const getCoords = (t) => {
    if (countryCoords[t.country]) return countryCoords[t.country];
    if (t.country === "Localhost" || !t.ip) return null;
    
    // Deterministic pseudo-random generation based on IP octets
    const octets = t.ip.split('.').map(Number);
    if (octets.length !== 4) return { x: 200, y: 100 }; // Center default
    
    return {
      x: 40 + (octets[0] + octets[1]) % 320,
      y: 30 + (octets[2] + octets[3]) % 140
    };
  };

  const activeMarkers = threats
    .map(t => ({ ...t, coords: getCoords(t) }))
    .filter(t => t.coords !== null)
    .slice(0, 10); // Display top 10 recent vectors

  return (
    <div className="glass-panel p-6 h-full relative overflow-hidden group hover-tilt stagger-3">
      {/* Internal Grid Scan */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
        <div className="w-full h-[1px] bg-primary shadow-[0_0_10px_var(--primary-glow)] animate-scanline"></div>
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Globe size={20} className="text-primary animate-pulse" />
        </div>
        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-white">Global Threat Matrix</h3>
      </div>

      <div className="relative w-full aspect-[1.8/1] bg-primary/5 rounded-2xl border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Authentic SVG World Map Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "invert(1) sepia(1) hue-rotate(180deg) saturate(5) brightness(0.8)"
          }}
        />

        {/* Global Markers */}
        {activeMarkers.map((t, idx) => {
          const { x, y } = t.coords;
          return (
            <div 
              key={`marker-${idx}`}
              className="absolute group/marker"
              style={{ left: `${(x / 400) * 100}%`, top: `${(y / 200) * 100}%` }}
            >
              <div className="w-3 h-3 bg-neon-red rounded-full relative shadow-[0_0_20px_var(--danger)] animate-ping opacity-40"></div>
              <div className="w-3 h-3 bg-neon-red rounded-full absolute top-0 left-0 shadow-[0_0_15px_var(--danger)]"></div>
              
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-bg-dark/95 backdrop-blur-xl p-3 rounded-xl text-[10px] hidden group-hover/marker:block z-30 whitespace-nowrap border border-neon-red/30 shadow-2xl">
                <div className="flex flex-col gap-1">
                    <span className="font-black text-neon-red uppercase tracking-widest">{t.attackType}</span>
                    <span className="text-white font-bold opacity-80">Origin: {t.country}</span>
                    <span className="text-dim text-[8px] font-mono">{t.ip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-2 relative z-10">
        {activeMarkers.map((t, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] glass-panel border-white/5 p-2 px-3 hover:bg-white/5 transition-colors stagger-3">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse shadow-[0_0_8px_var(--neon-red)]"></span>
                <span className="text-white font-bold tracking-tight">{t.ip}</span>
            </div>
            <span className="text-dim font-black uppercase text-[8px] tracking-widest">{t.country}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
