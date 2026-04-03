import React from "react";

export default function LandingPage({ onEnter }) {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-bg-dark">
      
      {/* ── Layer 1: Background image with Ken Burns zoom ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070')",
            opacity: 0.08,
          }}
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, var(--bg-dark) 80%)",
            opacity: 0.9,
          }}
        />
        {/* Top + Bottom fades */}
        <div className="absolute inset-x-0 top-0 h-40" style={{ background: "linear-gradient(to bottom, var(--bg-dark), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to top, var(--bg-dark), transparent)" }} />
        {/* Cyber grid */}
        <div className="cyber-grid" style={{ opacity: 0.18 }} />
      </div>

      {/* ── Layer 2: Orbital ring decoration ── */}
      <div className="absolute z-10 pointer-events-none" style={{ width: 640, height: 640, opacity: 0.35 }}>
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(0,242,255,0.18)", animation: "spin-cw 24s linear infinite" }} />
        <div className="absolute rounded-full" style={{ inset: "40px", border: "1px solid rgba(189,0,255,0.12)", animation: "spin-ccw 36s linear infinite" }} />
        <div className="absolute rounded-full" style={{ inset: "80px", border: "1px solid rgba(0,242,255,0.08)", animation: "spin-cw 50s linear infinite" }} />
        {/* Orbit dots */}
        <div className="absolute" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--primary)",
          boxShadow: "0 0 10px var(--primary)",
          top: "50%", left: 0,
          transform: "translateY(-50%)",
          animation: "spin-cw 24s linear infinite",
          transformOrigin: "320px 0"
        }} />
        <div className="absolute" style={{
          width: 4, height: 4, borderRadius: "50%",
          background: "var(--secondary)",
          boxShadow: "0 0 8px var(--secondary)",
          top: 0, left: "50%",
          transform: "translateX(-50%)",
          animation: "spin-ccw 36s linear infinite",
          transformOrigin: "0 280px"
        }} />
      </div>

      {/* ── Layer 3: Main Hero Content ── */}
      <div className="relative z-20 text-center px-6 animate-fade-in stagger-1" style={{ maxWidth: "48rem" }}>

        {/* Academic Tag */}
        <div className="flex justify-center mb-10">
          <div className="academic-branding">
            <span className="kl-tag animate-pulse">KL UNIVERSITY</span>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.45em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              Major Project Submission 2026
            </span>
          </div>
        </div>

        {/* Project Title */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            className="font-black text-white"
            style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
          >
            YMCS
            <br />
            <span className="gradient-text" style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)", display: "inline-block" }}>
              SHIELD
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)",
            color: "var(--text-dim)",
            maxWidth: "38rem",
            margin: "1.5rem auto 0",
            lineHeight: 1.7,
            fontWeight: 400,
          }}>
            Next-Generation Web Application Firewall powered by{" "}
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>Neural Engine v2.0</span>.
            Real-time threat intelligence &amp; automated perimeter defense.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-8">
          <button
            onClick={onEnter}
            className="group relative overflow-hidden transition-all"
            style={{
              padding: "18px 52px",
              background: "var(--primary)",
              color: "#000",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(0,242,255,0.35), 0 8px 32px rgba(0,0,0,0.5)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.06)";
              e.currentTarget.style.boxShadow = "0 0 60px rgba(0,242,255,0.5), 0 12px 40px rgba(0,0,0,0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(0,242,255,0.35), 0 8px 32px rgba(0,0,0,0.5)";
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={e  => { e.currentTarget.style.transform = "scale(1.06)"; }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 skew-x-12"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                transform: "translateX(-100%) skewX(12deg)",
                transition: "transform 0.5s ease",
                pointerEvents: "none",
              }}
            />
            <span className="relative z-10 flex items-center gap-3">
              INITIALIZE SECURE SESSION
              <span
                style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(0,0,0,0.3)",
                  borderTopColor: "#000",
                  borderRadius: "50%",
                  animation: "spin 1.2s linear infinite",
                  display: "inline-block"
                }}
              />
            </span>
          </button>

          {/* Student Metadata */}
          <div
            className="flex justify-center gap-24"
            style={{ opacity: 0.55, transition: "opacity 0.5s ease" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; }}
          >
            <div className="text-right flex flex-col gap-1.5">
              <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 4 }}>
                Student Team
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", fontStyle: "italic" }}>
                K. Meghana
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", fontStyle: "italic" }}>
                R. Yamini
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", fontStyle: "italic" }}>
                G. Charan
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase", fontStyle: "italic" }}>
                V V G D SRINIDHI
              </span>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.12)" }} />
            <div className="text-left flex flex-col gap-1">
              <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.25em" }}>
                Neural Core
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.15em", textShadow: "0 0 10px rgba(0,255,149,0.3)" }}>
                STABLE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer 4: Corner HUD Labels ── */}
      <div className="absolute bottom-10 left-10 hidden md:block" style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.22 }}>
        Protocol: SCC-256 / Neural Node 09
      </div>
      <div className="absolute bottom-10 right-10 hidden md:block" style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.22 }}>
        © 2026 YMCS Shield Systems
      </div>
    </div>
  );
}
