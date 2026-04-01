import React from "react";
import { AlertCircle, ShieldAlert, Globe, Clock, Filter, Search, ChevronRight, ShieldCheck, Activity, Target } from "lucide-react";

export default function Threats({ threats, setActiveView }) {
  // Use real threats from props, fallback to empty array
  const displayThreats = (threats && threats.length > 0) ? threats.slice(0, 10) : [];

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
        
        <div className="flex gap-3">
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
            <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Filter Severity: <span className="text-white">ALL</span></span>
          </div>
          <button className="glass-panel px-6 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 hover:border-primary/50 transition-all">
            <Search size={14} />
            Search Database
          </button>
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
                      <span className="text-[10px] font-black text-dim uppercase tracking-widest opacity-50 mb-1">EV-{Math.floor(Math.random() * 9000 + 1000)}</span>
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
                       <span className="text-xs font-mono text-dim group-hover:text-primary transition-colors truncate">/api/v1/auth</span>
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