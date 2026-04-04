import React, { useState, useEffect } from "react";
import { Shield, ChevronLeft } from "lucide-react";

export default function Login({ onSuccess, onBack }) {
  const [isScanning, setIsScanning]     = useState(false);
  const [scanProgress, setScanProgress]  = useState(0);
  const [status, setStatus]             = useState("Awaiting Credentials");
  const [granted, setGranted]           = useState(false);
  
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");

  const startScan = () => {
    if (!username || !password) {
      setStatus("Input Required: Please enter credentials");
      return;
    }
    if (isScanning || granted) return;
    setIsScanning(true);
    setStatus("Scanning Neural Pattern...");
  };

  useEffect(() => {
    let interval;
    if (isScanning && scanProgress < 100) {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 2;
        });
      }, 40);
    } else if (scanProgress >= 100 && isScanning) {
      // Execute Real Authentication!
      const API_BASE_LOCAL = window.location.hostname === "localhost" ? "http://localhost:4000" : "https://ymcs-shield-backend.onrender.com";
      fetch(`${API_BASE_LOCAL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      .then(async res => {
        if (res.status === 404) throw new Error("ROUTE_NOT_FOUND");
        if (res.status === 401) throw new Error("INVALID_AUTH");
        if (!res.ok) throw new Error("NETWORK_FAILURE");
        return res.json();
      })
      .then(data => {
        if (data.token) {
          localStorage.setItem("waf_jwt_token", data.token);
          setGranted(true);
          setStatus(`Access Granted: Welcome ${data.user?.username || username}`);
          setTimeout(() => onSuccess(), 900);
        } else {
          throw new Error("INVALID_AUTH");
        }
      })
      .catch((err) => {
        let msg = "Access Denied: Core Offline";
        if (err.message === "INVALID_AUTH") msg = "Access Denied: Invalid Neural Signature";
        if (err.message === "ROUTE_NOT_FOUND") msg = "Sync Error: API v2.0.5 Not Found";
        if (err.message === "SECURE_DATABASE_OFFLINE") msg = "System Warning: Secure Database Offline";
        
        setStatus(msg);
        setIsScanning(false);
        setScanProgress(0);
      });
    }
    return () => clearInterval(interval);
  }, [isScanning, scanProgress, onSuccess]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-bg-dark overflow-hidden">
      
      {/* Background grid */}
      <div className="cyber-grid absolute inset-0 z-0" style={{ opacity: 0.12 }} />

      {/* Ambient glow spheres */}
      <div className="absolute pointer-events-none" style={{
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)"
      }} />

      {/* ── Login Card ── */}
      <div
        className="relative z-10 glass-panel animate-fade-in flex flex-col items-center"
        style={{ width: 440, padding: "2.5rem 2.5rem 2rem" }}
      >
        {/* Card Header */}
        <div className="flex items-center gap-3 mb-8 w-full">
          <div style={{
            width: 3, height: 44,
            background: "var(--primary)",
            borderRadius: 2,
            boxShadow: "0 0 12px var(--primary-glow)"
          }} />
          <div>
            <h3 className="font-black gradient-text uppercase tracking-widest" style={{ fontSize: 17, fontFamily: "var(--font-sans)" }}>
              Security Access
            </h3>
            <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.55 }}>
              Level 4 Terminal Authorization
            </span>
          </div>
        </div>

        {/* Biometric Scanner */}
        <div
          className="relative"
          style={{ width: 192, height: 192, marginBottom: "2.5rem", cursor: isScanning ? "default" : "pointer" }}
          onClick={startScan}
        >
          {/* Outer progress ring (SVG) */}
          <svg
            width="192" height="192"
            style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
          >
            <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
            <circle
              cx="96" cy="96" r="88"
              stroke={granted ? "var(--success)" : "var(--primary)"}
              strokeWidth="3"
              fill="none"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * scanProgress) / 100}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${granted ? "var(--success-glow)" : "var(--primary-glow)"})`,
                transition: "stroke-dashoffset 0.08s linear, stroke 0.5s ease"
              }}
            />
          </svg>

          {/* Spinning ring */}
          {isScanning && !granted && (
            <div
              className="absolute rounded-full animate-spin-slow"
              style={{
                inset: 12,
                border: "1px dashed rgba(0,242,255,0.25)",
              }}
            />
          )}

          {/* Inner circle */}
          <div
            className="absolute rounded-full flex items-center justify-center overflow-hidden"
            style={{
              inset: 20,
              background: granted
                ? "rgba(0,255,149,0.08)"
                : isScanning
                  ? "rgba(0,242,255,0.06)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${granted ? "rgba(0,255,149,0.25)" : isScanning ? "rgba(0,242,255,0.15)" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.5s ease"
            }}
          >
            {/* Scan sweep line */}
            {isScanning && !granted && (
              <div style={{
                position: "absolute", inset: 0,
                overflow: "hidden",
                borderRadius: "50%"
              }}>
                <div style={{
                  width: "100%",
                  height: 2,
                  background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                  boxShadow: "0 0 12px var(--primary-glow)",
                  position: "absolute",
                  top: 0,
                  animation: "scanline 1.4s linear infinite"
                }} />
              </div>
            )}

            {/* Fingerprint / check icon */}
            {granted ? (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="64" height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isScanning ? "rgba(0,242,255,0.5)" : "rgba(255,255,255,0.18)"}
                strokeWidth="1"
                strokeLinecap="round"
                style={{ transition: "stroke 0.5s ease" }}
              >
                <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            )}

            {/* Touch prompt */}
            {!isScanning && (
              <span style={{
                position: "absolute",
                bottom: 12,
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                fontWeight: 700
              }}>
                Touch to Verify
              </span>
            )}
          </div>

          {/* Progress label */}
          {isScanning && !granted && (
            <div style={{
              position: "absolute",
              bottom: -24,
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              fontSize: 10,
              fontWeight: 900,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.25em"
            }}>
              Match: {scanProgress}%
            </div>
          )}
        </div>

        {/* Status box */}
        <div
          style={{
            width: "100%",
            marginBottom: "1.5rem",
            padding: "14px 20px",
            borderRadius: 12,
            background: granted
              ? "rgba(0,255,149,0.06)"
              : isScanning
                ? "rgba(0,242,255,0.04)"
                : "rgba(255,255,255,0.03)",
            border: `1px solid ${granted ? "rgba(0,255,149,0.2)" : isScanning ? "rgba(0,242,255,0.15)" : "rgba(255,255,255,0.06)"}`,
            textAlign: "center",
            transition: "all 0.5s ease"
          }}
        >
          <p style={{
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: granted ? "var(--success)" : isScanning ? "var(--primary)" : "var(--text-dim)",
            animation: (isScanning && !granted) ? "pulse 1.5s ease infinite" : "none"
          }}>
            {status}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mt-8 relative z-20">
          {/* Real Inputs for Admin Login */}
          <div className="flex flex-col gap-4 w-64 mb-4">
              <input 
                type="text" 
                placeholder="ADMINISTRATOR ID" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startScan()}
                className="bg-black/40 border border-primary/20 outline-none text-white text-xs font-mono px-4 py-3 text-center uppercase tracking-widest placeholder:text-dim/40 rounded focus:border-primary transition-colors"
                disabled={isScanning}
              />
              <input 
                type="password" 
                placeholder="ENCRYPTION KEY" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startScan()}
                className="bg-black/40 border border-primary/20 outline-none text-white text-xs font-mono px-4 py-3 text-center uppercase tracking-widest placeholder:text-dim/40 rounded focus:border-primary transition-colors"
                disabled={isScanning}
              />
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 w-full transition-colors"
          style={{
            padding: "14px",
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "rgba(100,116,139,0.6)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(224,230,237,0.8)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,116,139,0.6)"; }}
        >
          <ChevronLeft size={12} />
          Return to Surface
        </button>
      </div>

      {/* ── Floating HUD panels ── */}
      <div
        className="academic-card absolute hidden md:block"
        style={{ top: "5rem", right: "5rem", width: 180, opacity: 0.45, animation: "fade-in 1s ease forwards" }}
      >
        <h4 style={{ fontSize: 9, color: "var(--primary)", marginBottom: 4, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>Terminal ID</h4>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)" }}>WAF-X-8800-ALPHA</p>
      </div>

      <div
        className="academic-card absolute hidden md:block"
        style={{ bottom: "5rem", left: "5rem", width: 180, opacity: 0.45, animation: "fade-in 1.2s ease forwards" }}
      >
        <h4 style={{ fontSize: 9, color: "var(--primary)", marginBottom: 4, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>Encrypted Node</h4>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)" }}>0x05...FF21</p>
      </div>

      {/* Shield icon bottom center */}
      <div style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6, opacity: 0.15 }}>
        <Shield size={12} style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: "var(--text-dim)" }}>
          End-to-End Encrypted
        </span>
      </div>
    </div>
  );
}
