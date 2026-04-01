import React from "react";

export default function CyberBackground({ children }) {
  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      
      {/* ── Background Layer Group (z-0) ── */}
      <div className="fixed inset-0 z-0 bg-bg-dark pointer-events-none">
        {/* Layer 1: Radial atmospheric glow */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 10% 10%, rgba(0, 242, 255, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 90% 10%, rgba(189, 0, 255, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 50% 90%, rgba(0, 255, 149, 0.03) 0%, transparent 40%)
          `
        }} />

        {/* Layer 2: Scrolling grid */}
        <div className="cyber-grid" style={{ opacity: 0.12 }} />

        {/* Layer 3: Moving scanlines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-1 bg-primary/10 absolute top-[-10%] animate-scanline" style={{ filter: "blur(2px)", boxShadow: "0 0 15px var(--primary-glow)" }} />
          <div className="w-full h-[0.5px] bg-secondary/10 absolute top-[-20%] animate-scanline" style={{ animationDelay: "6s", opacity: 0.3 }} />
        </div>

        {/* Layer 4: Distant "star" noise */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: "64px 64px",
          backgroundPosition: "-32px -32px",
          opacity: 0.2
        }} />

        {/* Layer 5: HUD Overlay Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      </div>

      {/* ── Content Layer Group (z-10) ── */}
      <div className="relative z-10 w-full h-full flex pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
