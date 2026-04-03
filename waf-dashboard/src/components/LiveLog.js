import React from "react";
import { Terminal, Shield, AlertTriangle, CheckCircle2, Cpu, Activity, Globe, Search, Filter, Trash2 } from "lucide-react";

export default function LiveLog({ logs }) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const displayLogs = (logs && logs.length > 0) ? logs.map((l, i) => ({
    id: l._id || `L-${i}`,
    time: new Date(l.timestamp).toLocaleTimeString(),
    statusText: l.status,
    type: l.attackType || "Safe Traffic",
    ip: l.ip || "127.0.0.1",
    isBlocked: l.status === "BLOCKED"
  })).filter(log => 
    log.ip.includes(searchTerm) || 
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.statusText.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex flex-col h-full gap-8 animate-slide-up stagger-1 overflow-hidden">
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(0,242,255,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(0,242,255,0.2)",
              boxShadow: "0 4px 20px rgba(0,242,255,0.06)"
            }}>
              <Terminal className="text-primary" size={24} />
            </div>
            Persistence Stream
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)", display: "inline-block" }} className="animate-pulse" />
            Live Packet Inspection • Buffer Node-B
          </p>
        </div>
      </div>

      {/* ── Log Terminal ── */}
      <div className="flex-1 glass-card p-0 flex flex-col overflow-hidden border-primary/10 shadow-[inner_0_4px_24px_rgba(0,0,0,0.8)] min-h-[500px]">
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
             <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-danger opacity-40" />
                <div className="w-2 h-2 rounded-full bg-warning opacity-40" />
                <div className="w-2 h-2 rounded-full bg-success opacity-40" />
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10">
                <Search size={10} className="text-dim" />
                <input 
                  type="text"
                  placeholder="Grep Live Stream..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-mono font-bold text-dim uppercase tracking-widest placeholder:text-dim/50 w-48"
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-mono text-success font-bold uppercase tracking-[0.2em] animate-pulse">● System Connected</span>
          </div>
        </div>

        {/* Log Entries Viewport */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-black/60 relative"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ 
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

          {/* Table Headers */}
          <div className="flex items-center px-6 py-3 border-b border-white/10 bg-white/5">
            <div className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-dim opacity-60">Timestamp</div>
            <div className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-dim opacity-60">Access Status</div>
            <div className="flex-[1.5] text-[10px] font-black uppercase tracking-[0.2em] text-dim opacity-60">Security Event</div>
            <div className="flex-1 text-right text-[10px] font-black uppercase tracking-[0.2em] text-dim opacity-60">Source IP node</div>
          </div>

          {displayLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6 py-20">
               <Cpu size={40} className="animate-spin-slow text-primary" />
               <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">Synchronizing Neural Buffer...</p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ contain: "content" }}>
              {displayLogs.slice(0, 50).map((log) => (
                <div key={log.id} className="group flex items-center px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-all">
                  {/* Forensic Columns */}
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-dim opacity-60 group-hover:text-white transition-colors">{log.time}</span>
                  </div>

                  <div className="flex-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${log.isBlocked ? "bg-danger/10 text-danger border-danger/20" : "bg-success/10 text-success border-success/20"}`}>
                      {log.statusText}
                    </span>
                  </div>

                  <div className="flex-[1.5]">
                    <span className="text-[11px] font-bold text-white tracking-wide">{log.type}</span>
                  </div>

                  <div className="flex-1 flex justify-end">
                    <div className="flex flex-col items-end">
                      <span className="text-[12px] font-mono font-black text-primary glow-text-sm">{log.ip}</span>
                      <span className="text-[7px] font-black text-dim uppercase tracking-tighter opacity-40">Verified Identity</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-6 py-3 bg-black/80 border-t border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-dim uppercase tracking-widest">X-8800-ALPHA // STABLE</span>
           </div>
           <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] font-mono">Real-time Buffer Linked</p>
        </div>
      </div>

    </div>
  );
}