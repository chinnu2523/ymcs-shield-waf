import React, { useState, useEffect } from "react";
import { ShieldAlert, Unlock, Clock, Activity, Target } from "lucide-react";
import API_BASE from "../config";

export default function BlocklistManager() {
  const [blocklist, setBlocklist] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  const fetchBlocklist = async () => {
    try {
      const token = localStorage.getItem("waf_jwt_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_BASE}/blocklist`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBlocklist(data);
      }
    } catch (e) {
      console.error("Failed to fetch blocklist:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklist();
    const interval = setInterval(fetchBlocklist, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUnblock = async (ip) => {
    setUnblocking(ip);
    try {
      const token = localStorage.getItem("waf_jwt_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_BASE}/blocklist/${ip}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        setBlocklist(prev => prev.filter(b => b.ip !== ip));
      }
    } catch (e) {
      console.error("Failed to unblock IP", e);
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-danger/30 bg-danger/10 flex items-center justify-center animate-pulse">
              <ShieldAlert size={20} className="text-danger" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] glitch-text">
              Blocklist <span className="text-danger font-light">Manager</span>
            </h1>
          </div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-dim ml-14">
            Manage Persistent Access Controls
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-danger/20">
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Target size={16} className="text-danger" />
            Active IP Blocks
          </h3>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-danger animate-pulse" />
            <span className="text-[10px] font-mono text-danger uppercase tracking-widest">{blocklist.length} Enforced</span>
          </div>
        </div>

        {loading ? (
           <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
              <Clock size={40} className="animate-spin text-dim" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-dim">Syncing DB...</p>
           </div>
        ) : blocklist.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
            <ShieldAlert size={40} className="text-dim" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-dim">Blocklist is currently empty.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {blocklist.map((block, i) => {
              const isTemp = block.expiresAt;
              return (
                <div key={block._id || i} className="group flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 transition-all relative">
                  <div className="flex items-center gap-8 flex-1">
                    <div className="w-1 h-10 rounded-full" style={{ background: "var(--danger)", boxShadow: `0 0 10px var(--danger)` }} />
                    
                    <div className="flex flex-col flex-1 max-w-[200px]">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Target Identity</span>
                       <span className="text-sm font-mono text-white group-hover:text-danger transition-colors truncate">{block.ip}</span>
                    </div>

                    <div className="flex flex-col flex-1">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Block Reason</span>
                       <span className="text-xs font-black text-dim">{block.reason || "Manual Block"}</span>
                    </div>

                    <div className="flex flex-col min-w-[150px]">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Status</span>
                       <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border" style={{ 
                         color: isTemp ? "var(--warning)" : "var(--danger)", 
                         borderColor: isTemp ? "var(--warning)30" : "var(--danger)30", 
                         background: isTemp ? "var(--warning)10" : "var(--danger)10",
                         width: "fit-content"
                       }}>
                         {isTemp ? "TEMPORARY" : "PERMANENT"}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pl-10">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono font-bold text-dim">
                        Blocked: {new Date(block.blockedAt).toLocaleTimeString()}
                      </span>
                      {isTemp && (
                        <span className="text-[9px] font-mono font-bold text-warning">
                          Expires: {new Date(block.expiresAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => handleUnblock(block.ip)}
                      disabled={unblocking === block.ip}
                      className="px-4 py-2 rounded-lg border border-success/30 text-success text-[9px] font-black uppercase tracking-widest hover:bg-success/10 transition-colors flex items-center gap-2"
                    >
                       {unblocking === block.ip ? <Clock size={12} className="animate-spin" /> : <Unlock size={12} />}
                       UNBLOCK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
