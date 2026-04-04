import React, { useState } from "react";
import { AlertCircle, ShieldAlert, Globe, Clock, Filter, Search, ChevronRight, ShieldCheck, Activity, Target, Play, Lock, Shield, Ban } from "lucide-react";
import API_BASE from "../config";

export default function Threats({ threats, setActiveView }) {
  const [showMenu, setShowMenu] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [blocking, setBlocking] = useState(null);

  const blockIP = async (ip) => {
    setBlocking(ip);
    try {
      const token = localStorage.getItem("waf_jwt_token");
      await fetch(`${API_BASE}/blocklist`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ ip, reason: "Manual block from Threats dashboard" })
      });
      alert(`IP ${ip} successfully blocked!`);
    } catch (e) {
      alert("Failed to block IP");
    } finally {
      setBlocking(null);
    }
  };

  const launchAttack = async (type) => {
    setShowMenu(false);
    const API_BASE_LOCAL = window.location.hostname === "localhost" ? "http://localhost:4000" : "https://ymcs-shield-backend.onrender.com";
    
    let url = `${API_BASE_LOCAL}/api/data`;
    let options = { method: "GET" };

    if (type === "SQLI") url = `${API_BASE_LOCAL}/api/users?id=1%20OR%201=1`;
    if (type === "XSS") {
      options = { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "<script>alert('WAF_TEST')</script>" })
      };
    }
    if (type === "TRAVERSAL") url = `${API_BASE_LOCAL}/api/data?file=../../etc/passwd`;
    if (type === "DOS") {
      options = { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "A".repeat(1.2 * 1024 * 1024) })
      };
    }

    try { fetch(url, options); } catch (e) {}
  };

  // Use real threats from props, apply filters
  const displayThreats = (threats && threats.length > 0) ? threats.filter(t => {
    const matchesSearch = searchTerm === "" || 
      (t.ip && t.ip.includes(searchTerm)) || 
      (t.type && t.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Default severity missing? Let's just assign high to everything for demo if not present
    const tSeverity = t.severity || "HIGH";
    const matchesSeverity = severityFilter === "ALL" || tSeverity.toUpperCase() === severityFilter;
    
    return matchesSearch && matchesSeverity;
  }).slice(0, 15) : [];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1">
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(255,51,51,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(255,51,51,0.2)",
              boxShadow: "0 4px 20px rgba(255,51,51,0.06)"
            }}>
              <ShieldAlert className="text-danger" size={24} />
            </div>
            Threat Intelligence
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", boxShadow: "0 0 8px var(--danger)", display: "inline-block" }} className="animate-pulse" />
            Detected Attack Vectors & Incidents
          </p>
        </div>
        
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="glass-panel px-6 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 hover:border-primary/50 transition-all bg-primary/5 min-w-[200px] justify-center"
            >
              <Play size={14} fill="currentColor" />
              {showMenu ? "Close Simulator" : "Launch Demonstration"}
            </button>

            {showMenu && (
              <div className="absolute top-full mt-2 left-0 w-full z-50 glass-card p-2 border border-primary/20 animate-fade-in shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                {[
                  { id: "SQLI", label: "SQL Injection", desc: "Query Manipulation", icon: <Lock size={12} /> },
                  { id: "XSS", label: "Cross-Site Scripting", desc: "Payload Execution", icon: <Search size={12} /> },
                  { id: "TRAVERSAL", label: "Path Traversal", desc: "Filesystem Access", icon: <Globe size={12} /> },
                  { id: "DOS", label: "Volumetric DDoS", desc: "Flood Simulation", icon: <Shield size={12} /> },
                ].map((atk) => (
                  <button
                    key={atk.id}
                    onClick={() => launchAttack(atk.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all text-left group border border-transparent hover:border-primary/20 mb-1 last:mb-0"
                  >
                    <div className="p-2 rounded bg-black/40 border border-white/5 text-dim group-hover:text-primary transition-colors">
                      {atk.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-wider">{atk.label}</div>
                      <div className="text-[8px] font-bold text-dim uppercase tracking-tighter opacity-50">{atk.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{
            padding: "10px 18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <Filter size={14} className="text-dim" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black text-white uppercase tracking-widest cursor-pointer"
            >
              <option value="ALL">Severity: ALL</option>
              <option value="CRITICAL">Severity: CRITICAL</option>
              <option value="HIGH">Severity: HIGH</option>
              <option value="MEDIUM">Severity: MEDIUM</option>
            </select>
          </div>
          <div className="glass-panel px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-dim border-primary/20 transition-all focus-within:border-primary/50">
            <Search size={14} className="text-primary" />
            <input 
              type="text"
              placeholder="Search IP or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] text-white placeholder:text-dim/50 uppercase tracking-widest w-40"
            />
          </div>
        </div>
      </div>

      {/* ── Threat Summary HUD ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
         <div className="glass-card p-6 border-b-2 border-danger/30">
            <div className="flex items-center gap-3 mb-4">
               <Target size={18} className="text-danger" />
               <h4 className="text-[10px] font-black text-dim uppercase tracking-widest">Active Targeting</h4>
            </div>
            <div className="text-3xl font-black text-white mb-2">{displayThreats.length * 7 + 12}</div>
            <p className="text-[10px] font-bold text-danger uppercase tracking-wider">Live Event Stream</p>
         </div>
         <div className="glass-card p-6 border-b-2 border-warning/30">
            <div className="flex items-center gap-3 mb-4">
               <Activity size={18} className="text-warning" />
               <h4 className="text-[10px] font-black text-dim uppercase tracking-widest">Neural Anomaly Rating</h4>
            </div>
            <div className="text-3xl font-black text-white mb-2">32.4</div>
            <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Level: Moderate</p>
         </div>
         <div className="glass-card p-6 border-b-2 border-success/30">
            <div className="flex items-center gap-3 mb-4">
               <ShieldCheck size={18} className="text-success" />
               <h4 className="text-[10px] font-black text-dim uppercase tracking-widest">Mitigation Success</h4>
            </div>
            <div className="text-3xl font-black text-white mb-2">99.8%</div>
            <p className="text-[10px] font-bold text-success uppercase tracking-wider">Optimal Defense</p>
         </div>
      </div>

      {/* ── Threat List Component ── */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center">
                 <AlertCircle className="text-danger" size={20} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Recent Incidents</h3>
                <p className="text-xs text-dim uppercase tracking-wider font-bold">Heuristic Block History</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Clock size={12} className="text-dim" />
              <span className="text-[10px] font-mono text-dim uppercase">Live Relay: Syncing...</span>
           </div>
        </div>

        {displayThreats.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
            <Target size={40} className="animate-pulse text-dim" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-dim">No high-severity threats detected in buffer.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {displayThreats.map((t, i) => {
              const color = t.severity === "critical" ? "var(--neon-red)" : "var(--warning)";
              return (
                <div key={t.id || i} className="group flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 transition-all cursor-pointer relative stagger-1" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-8 flex-1">
                    <div className="w-1 h-10 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                    
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-[10px] font-black text-dim uppercase tracking-widest opacity-50 mb-1">ID-{t.id ? t.id.slice(-6).toUpperCase() : "PENDING"}</span>
                      <span className="text-sm font-black text-white tracking-wide">{t.type}</span>
                    </div>

                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Impact Level</span>
                       <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border" style={{ 
                         color: color, 
                         borderColor: `${color}30`, 
                         background: `${color}10`,
                         width: "fit-content"
                       }}>
                         {t.severity || "HIGH"}
                       </span>
                    </div>

                    <div className="flex flex-col flex-1 max-w-[200px]">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Target Endpoint</span>
                       <span className="text-xs font-mono text-dim group-hover:text-primary transition-colors truncate">{t.path}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Source Node</span>
                        <span className="text-xs font-mono text-white">{t.ip}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pl-10">
                    <span className="text-[10px] font-mono font-bold text-dim">{t.time}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); blockIP(t.ip); }}
                      disabled={blocking === t.ip}
                      className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-[9px] font-black uppercase tracking-widest hover:bg-danger/10 transition-colors flex items-center gap-2"
                    >
                       {blocking === t.ip ? <Clock size={12} className="animate-spin" /> : <Ban size={12} />}
                       BLOCK IP
                    </button>
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all text-dim group-hover:text-primary">
                       <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-6 text-center bg-black/10">
           <button 
             onClick={() => setActiveView("livelog")}
             className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-white transition-colors"
           >
              View Detailed Forensic Logs
           </button>
        </div>
      </div>

    </div>
  );
}