import React, { useState } from "react";
import { Activity, Shield, AlertCircle, Cpu, Globe, Lock, Search, Heart, Zap, Terminal, Play, Flame, Send, RotateCcw } from "lucide-react";
import API_BASE from "../config";

export default function Dashboard({ rules = [], counters, threats, logs, status = "online" }) {
  const [simulating, setSimulating] = useState(null); // null or { type, status }
  const [rebooting, setRebooting] = useState(false);

  const handleRestart = async () => {
    if (!window.confirm("CRITICAL: Confirmed System Reset? All logs and metrics will be purged.")) return;
    
    setRebooting(true);
    try {
      await fetch(`${API_BASE.replace("/api", "")}/api/reset`, { method: "POST" });
      // Reload page after cinematic delay
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (e) {
      console.error("Restart failed", e);
      setRebooting(false);
    }
  };

  const triggerAttack = async (type) => {
    setSimulating({ type, status: "DISPATCHING" });
    
    let url = `${API_BASE.replace("/api", "")}`;
    let options = { method: "GET" };

    if (type === "SQLI") url += "/api/users?id=1%20OR%201=1";
    if (type === "XSS") {
      url += "/api/data";
      options = { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "<script>alert('WAF_TEST')</script>" })
      };
    }
    if (type === "TRAVERSAL") url += "/api/data?file=../../etc/passwd";
    if (type === "DOS") {
      url += "/api/data";
      options = { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "A".repeat(1.5 * 1024 * 1024) })
      };
    }

    try {
      const res = await fetch(url, options);
      if (res.status === 403 || res.status === 413 || res.status === 429) {
        setSimulating({ type, status: "MITIGATED" });
      } else {
        setSimulating({ type, status: "FAILED (Unexpected Status)" });
      }
    } catch (e) {
      setSimulating({ type, status: "ERROR" });
    }

    // Reset after 3 seconds
    setTimeout(() => setSimulating(null), 3000);
  };
  const displayLogs = (logs && Array.isArray(logs)) ? logs.map((l, i) => ({
    id: l._id || `L-${i}`,
    time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : "Pending...",
    status: l.status || "UNKNOWN",
    ip: l.ip || "127.0.0.1",
    path: l.path || "/",
    isBlocked: l.status === "BLOCKED"
  })).slice(0, 7) : [];
  const stats = [
    { label: "Total Ingress",       value: counters?.total || 0,   unit: "REQS",  icon: <Activity size={18} />, color: "var(--primary)" },
    { label: "Mitigated Attacks",  value: counters?.blocked || 0, unit: "BLOCKED", icon: <Shield size={18} />, color: "var(--danger)" },
    { label: "Mean Latency",       value: counters?.latency || 0, unit: "MS",      icon: <Zap size={18} />,    color: "var(--warning)" },
    { label: "Active Threats",     value: threats?.length || 0,   unit: "LIVE",    icon: <AlertCircle size={18} />, color: "var(--secondary)" },
  ];

  const getLayerStatus = (id) => {
    const ruleMapping = {
      "SQL-INJ": "RL-101",
      "XSS-SHD": "RL-102",
      "RAT-LIM": "RL-205",
      "BOT-DET": "RL-412",
      "DDO-GRD": "RL-205", // Volumetric DDoS matches Rate Limiting Core
      "PTH-GRD": "RL-880"
    };
    const ruleId = ruleMapping[id];
    const rule = rules.find(r => r.id === ruleId);
    return rule?.enabled ? { status: "Active", health: 100 } : { status: "Standby", health: 0 };
  };

  const layers = [
    { id: "SQL-INJ", name: "SQL Injection Filter", ...getLayerStatus("SQL-INJ"),  icon: <Lock size={14} /> },
    { id: "XSS-SHD", name: "XSS Shield Layer",     ...getLayerStatus("XSS-SHD"),  icon: <Search size={14} /> },
    { id: "RAT-LIM", name: "Dynamic Rate Limiter", ...getLayerStatus("RAT-LIM"),  icon: <Activity size={14} /> },
    { id: "BOT-DET", name: "Neural Bot Detector",  ...getLayerStatus("BOT-DET"),  icon: <Cpu size={14} /> },
    { id: "DDO-GRD", name: "Volumetric DDoS Guard", ...getLayerStatus("DDO-GRD"), icon: <Shield size={14} /> },
    { id: "PTH-GRD", name: "Path Traversal Filter", ...getLayerStatus("PTH-GRD"), status: "Active", icon: <Terminal size={14} />, health: 100 },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1">
      
      {/* ── Dashboard Header ── */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(0,242,255,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(0,242,255,0.2)",
              boxShadow: "0 4px 20px rgba(0,242,255,0.06)"
            }}>
              <Activity className="text-primary" size={24} />
            </div>
            Operation Command
          </h1>
            <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
              <span style={{ 
                width: 8, height: 8, borderRadius: "50%", 
                background: status === "online" ? "var(--success)" : status === "loading" ? "var(--warning)" : "var(--danger)", 
                boxShadow: `0 0 8px ${status === "online" ? "var(--success)" : status === "loading" ? "var(--warning)" : "var(--danger)"}`, 
                display: "inline-block" 
              }} className={status === "online" ? "animate-pulse" : ""} />
              {status === "online" ? "Shield Synchronized • Node-Alpha-01" : status === "loading" ? "Initializing Connection..." : "WAF Core Offline • Connection Lost"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRestart}
              className="glass-panel px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60 border-primary/10 hover:border-primary/50 hover:text-primary transition-all bg-primary/2 h-[44px] rounded-xl mr-2"
            >
              <RotateCcw size={14} />
              Reset System Data
            </button>
            <div style={{
              padding: "10px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div className="flex flex-col items-end">
                <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>System Local Time</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

      {/* ── Attack Simulation Overlay ── */}
      {simulating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="glass-card p-10 border-2 border-primary/50 shadow-[0_0_50px_rgba(0,242,255,0.2)] flex flex-col items-center gap-6 animate-scale-up">
              <div className="w-20 h-20 rounded-full border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/10 animate-spin flex items-center justify-center">
                 <Shield className="text-primary animate-pulse" size={32} />
              </div>
              <div className="text-center">
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Simulating Attack</h2>
                 <p className="text-primary font-mono text-xs">{simulating.type}: {simulating.status}...</p>
              </div>
           </div>
        </div>
      )}

      {/* ── Quick Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-card p-6 relative group border-t-2 overflow-hidden" style={{ borderColor: `${s.color}40`, transition: "all 0.4s ease" }}>
            {/* Background Glow */}
            <div style={{
              position: "absolute", top: -40, right: -40, width: 120, height: 120,
              background: `radial-gradient(circle, ${s.color}15 0%, transparent 70%)`,
              borderRadius: "50%",
              pointerEvents: "none"
            }} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div style={{ padding: "8px", background: `${s.color}10`, color: s.color, borderRadius: 10, border: `1px solid ${s.color}25` }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                LIVE RELAY
              </div>
            </div>

            <div className="relative z-10">
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{s.label}</h4>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>{s.value.toLocaleString()}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: s.color, opacity: 0.8 }}>{s.unit}</span>
              </div>
            </div>

            {/* Micro-sparkline replacement (animated bar) */}
            <div style={{ marginTop: "1rem", height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
              <div className="animate-progress" style={{ 
                height: "100%", width: "100%", 
                background: s.color, boxShadow: `0 0 10px ${s.color}`,
                animationDelay: `${i * 0.2}s` 
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Operations Row ── */}
      <div className="quantum-grid">
        {/* Left Column: Active Layers */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div style={{ background: "rgba(0,255,149,0.08)", padding: "10px", borderRadius: 12, border: "1px solid rgba(0,255,149,0.2)" }}>
                  <Shield size={20} className="text-success" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Neural Guard Layers</h3>
                  <p className="text-xs text-dim uppercase tracking-wider font-bold">Heuristic Policy Enforcement</p>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "var(--success)", background: "rgba(0,255,149,0.06)", padding: "4px 12px", borderRadius: 99, border: "1px solid rgba(0,255,149,0.15)", letterSpacing: "0.2em" }}>
                SECURE
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {layers.map((l, i) => (
                <div key={l.id} className="relative p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all group overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 border border-white/10 group-hover:border-primary/30 transition-colors">
                        {React.cloneElement(l.icon, { size: 14, className: l.health > 0 ? "text-primary" : "text-dim" })}
                      </div>
                      <div>
                        <div className="text-[11px] font-black tracking-widest text-dim mb-1 opacity-50">{l.id}</div>
                        <div className="text-xs font-bold text-white">{l.name}</div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 9, fontWeight: 900, 
                      color: l.health > 0 ? "var(--success)" : "var(--text-dim)",
                      padding: "2px 8px", borderRadius: 4, 
                      background: l.health > 0 ? "rgba(0,255,149,0.05)" : "rgba(255,255,255,0.03)",
                      border: "1px solid currentColor",
                      opacity: 0.8
                    }}>
                      {l.status}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                      <div style={{ 
                        height: "100%", width: `${l.health}%`, 
                        background: l.health > 90 ? "var(--success)" : l.health > 0 ? "var(--warning)" : "var(--text-dim)",
                        boxShadow: l.health > 0 ? `0 0 8px ${l.health > 90 ? "var(--success-glow)" : "var(--warning-glow)"}` : "none"
                      }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-dim">{l.health}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tools & Logs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* ── Security Stress Test (New Module) ── */}
          <div className="glass-card p-6 border-b-2 border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Flame size={60} className="text-primary" />
            </div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div style={{ background: "rgba(0,242,255,0.08)", padding: "10px", borderRadius: 12, border: "1px solid rgba(0,242,255,0.2)" }}>
                <Activity size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Security Stress Test</h3>
                <p className="text-[10px] text-dim uppercase tracking-wider font-bold">Launch Controlled Verification</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              {[
                { id: "SQLI", label: "SQL Injection", icon: <Lock size={14} />, desc: "Database Query Spoofing" },
                { id: "XSS", label: "Cross-Site Scripting", icon: <Search size={14} />, desc: "Script Payload Injection" },
                { id: "TRAVERSAL", label: "Path Traversal", icon: <Globe size={14} />, desc: "File System Exposure" },
                { id: "DOS", label: "DDoS Simulation", icon: <Shield size={14} />, desc: "Volumetric Traffic Spike" },
              ].map((atk) => (
                <button
                  key={atk.id}
                  onClick={() => triggerAttack(atk.id)}
                  disabled={!!simulating}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-primary/10 hover:border-primary/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 group-hover/btn:border-primary/50 text-white">
                    {atk.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wider mb-0.5">{atk.label}</div>
                    <div className="text-[8px] font-bold text-dim uppercase tracking-tight">{atk.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
               <div className="animate-pulse w-2 h-2 rounded-full bg-primary" />
               <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Ready for Verification Dispatch</span>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col flex-1 border-b-2 border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ background: "rgba(0,242,255,0.08)", padding: "10px", borderRadius: 12, border: "1px solid rgba(0,242,255,0.2)" }}>
                <Terminal size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Traffic Surveillance</h3>
                <p className="text-[10px] text-dim uppercase tracking-wider font-bold">Real-time IP Access Feed</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {displayLogs.length === 0 ? (
                <div className="py-10 text-center opacity-30">
                  <Activity size={24} className="mx-auto mb-2 animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Node Relay...</p>
                </div>
              ) : (
                displayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black text-white">{log.ip}</span>
                      <span className="text-[8px] font-bold text-dim uppercase truncate max-w-[120px]">{log.path}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${log.isBlocked ? "bg-danger/20 text-danger" : "bg-success/20 text-success"}`}>
                        {log.status}
                      </span>
                      <span className="text-[8px] font-mono text-dim mt-1 opacity-50">{log.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "1.5rem 0" }} />

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-dim uppercase tracking-wider opacity-60">
                <span>Surveillance Status</span>
                <span className="text-success font-black animate-pulse">● ACTIVE</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-dim uppercase tracking-wider opacity-60">
                <span>Kernel Node</span>
                <span className="text-white font-mono">v4.2.1-X8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Rebooting Cinematic Overlay ── */}
      {rebooting && (
        <div className="fixed inset-0 z-[9999] bg-black/99 backdrop-blur-2xl flex flex-col items-center justify-center p-10 select-none">
           <div className="relative mb-12">
              <div className="w-32 h-32 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Shield size={40} className="text-primary animate-pulse" />
              </div>
           </div>

           <div className="text-center max-w-md w-full">
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.5em] mb-4">Rebooting Neural Link</h2>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-6">
                 <div className="h-full bg-primary animate-[shimmer_4s_ease-in-out_infinite]" style={{ width: "100%", transformOrigin: "left" }} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Memory Flush", status: "COMPLETE" },
                   { label: "Telemetry Purge", status: "COMPLETE" },
                   { label: "Kernel Reload", status: "INITIALIZING" },
                   { label: "Neural Sync", status: "WAITING" },
                 ].map((step, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/2 p-2 px-3 border border-white/5 rounded">
                      <span className="text-[9px] font-black text-dim uppercase tracking-widest">{step.label}</span>
                      <span className={`text-[8px] font-bold ${step.status === "COMPLETE" ? "text-success" : "text-primary animate-pulse"} uppercase`}>{step.status}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="absolute bottom-10 font-mono text-[10px] text-primary/40 uppercase tracking-[0.3em] text-center">
              X-8800 Core Security Reset Sequence in Progress...<br/>
              Node: KL-Univ-Maj-Proj-Alpha
           </div>
        </div>
      )}
    </div>
  );
}
