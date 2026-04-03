import React, { useState } from "react";
import { Activity, Shield, AlertCircle, Cpu, Globe, Lock, Search, Zap, Terminal, Flame, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_BASE } from "../config";
import API_BASE from "../config";

export default function Dashboard({ rules = [], counters, threats, logs, status = "online" }) {
  const [simulating, setSimulating] = useState(null); 
  const [rebooting, setRebooting] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const handleRestart = async () => {
    if (!window.confirm("CRITICAL: Confirmed System Reset? All logs and metrics will be purged.")) return;
    
    setRebooting(true);
    try {
      await fetch(`${API_BASE}/reset`, { method: "POST" });
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
    
    // Cache buster to ensure the WAF actually processes the request
    const entropy = Math.random().toString(36).substring(7);
    const cb = `_t=${Date.now()}-${entropy}`;
    let url = BACKEND_BASE; // Use clean base URL without /api fragility
    let options = { method: "GET" };

    if (type === "SQLI")     url += `/api/users?id=1%20OR%201=1&${cb}`;
    if (type === "XSS") {
      url += `/api/data?${cb}`;
      options = { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "<script>alert('WAF_TEST')</script>" })
      };
    }
    if (type === "TRAVERSAL") url += `/api/data?file=../../etc/passwd&${cb}`;
    if (type === "DOS") {
      url += `/api/data?${cb}`;
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
        setSimulating({ type, status: "FAILED", code: res.status });
      }
    } catch (e) {
      setSimulating({ type, status: "ERROR" });
    }
    setTimeout(() => setSimulating(null), 3000);
  };

  const displayLogs = (logs && Array.isArray(logs)) ? logs.map((l, i) => ({
    id: l._id || `L-${i}`,
    time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : "Pending...",
    status: l.status || "UNKNOWN",
    ip: l.ip || "127.0.0.1",
    path: l.path || "/",
    type: l.attackType || "none",
    isBlocked: l.status === "BLOCKED"
  })).slice(0, 7) : [];

  // Null-safe stat values
  const stats = [
    { label: "Total Ingress",      value: counters?.total   ?? 0, unit: "REQS",    icon: <Activity size={18} />,     color: "var(--primary)" },
    { label: "Mitigated Attacks",  value: counters?.blocked ?? 0, unit: "BLOCKED", icon: <Shield size={18} />,       color: "var(--danger)" },
    { label: "Mean Latency",       value: counters?.latency ?? 0, unit: "MS",      icon: <Zap size={18} />,          color: "var(--warning)" },
    { label: "Active Threats",     value: threats?.length   ?? 0, unit: "LIVE",    icon: <AlertCircle size={18} />,  color: "var(--secondary)" },
  ];

  const getLayerStatus = (id) => {
    const ruleMapping = {
      "SQL-INJ": "RL-101",
      "XSS-SHD": "RL-102",
      "RAT-LIM": "RL-205",
      "BOT-DET": "RL-412",
      "DDO-GRD": "RL-205",
      "PTH-GRD": "RL-880"
    };
    const ruleId = ruleMapping[id];
    const rule = rules.find(r => r.id === ruleId);
    return rule?.enabled !== undefined ? { status: rule.enabled ? "Active" : "Standby", health: rule.enabled ? 100 : 0 } : { status: "Active", health: 100 };
  };

  const layers = [
    { id: "SQL-INJ", name: "SQL Injection Filter",  ...getLayerStatus("SQL-INJ"), icon: <Lock size={14} /> },
    { id: "XSS-SHD", name: "XSS Shield Layer",      ...getLayerStatus("XSS-SHD"), icon: <Search size={14} /> },
    { id: "RAT-LIM", name: "Dynamic Rate Limiter",  ...getLayerStatus("RAT-LIM"), icon: <Activity size={14} /> },
    { id: "BOT-DET", name: "Neural Bot Detector",   ...getLayerStatus("BOT-DET"), icon: <Cpu size={14} /> },
    { id: "DDO-GRD", name: "Volumetric DDoS Guard", ...getLayerStatus("DDO-GRD"), icon: <Shield size={14} /> },
    { id: "PTH-GRD", name: "Path Traversal Filter", ...getLayerStatus("PTH-GRD"), icon: <Terminal size={14} /> },
  ];

  const statusColors = {
    "MITIGATED": "var(--success)",
    "FAILED":    "var(--danger)",
    "ERROR":     "var(--warning)",
    "DISPATCHING": "var(--primary)"
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">
      
      {/* ── Dashboard Header ── */}
      <div className="flex justify-between items-end mb-2">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{ background: "rgba(0,242,255,0.08)", borderRadius: 14, border: "1px solid rgba(0,242,255,0.2)" }}>
              <Activity className="text-primary" size={24} />
            </div>
            Operation Command
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ 
              width: 8, height: 8, borderRadius: "50%", 
              background: status === "online" ? "var(--success)" : "var(--danger)", 
              boxShadow: `0 0 8px ${status === "online" ? "var(--success)" : "var(--danger)"}`, 
              display: "inline-block" 
            }} className="animate-pulse" />
            {status === "online" ? "Shield Synchronized • Node-Alpha-01" : "Connection Lost — Check Backend"}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <motion.button 
            onClick={handleRestart}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 51, 51, 0.2)", boxShadow: "0 0 25px rgba(255, 51, 51, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            animate={{ boxShadow: ["0 0 5px rgba(255, 51, 51, 0.2)", "0 0 20px rgba(255, 51, 51, 0.5)", "0 0 5px rgba(255, 51, 51, 0.2)"] }}
            transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
            style={{ background: "rgba(255, 51, 51, 0.1)", borderColor: "rgba(255, 51, 51, 0.3)", color: "var(--danger)" }}
            className="glass-panel px-6 py-2 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] h-[46px] rounded-xl border"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
              <RotateCcw size={16} />
            </motion.div>
            Danger: Reset Kernel
          </motion.button>
        </motion.div>
      </div>

      {/* ── Attack Simulation Modal ── */}
      <AnimatePresence>
        {simulating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="glass-card p-10 border-2 flex flex-col items-center gap-6" style={{ borderColor: `${statusColors[simulating.status] || "var(--primary)"}60` }}>
              <div className="w-20 h-20 rounded-full border-4 border-t-primary animate-spin flex items-center justify-center">
                <Shield style={{ color: statusColors[simulating.status] || "var(--primary)" }} size={32} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                {simulating.type}: <span style={{ color: statusColors[simulating.status] || "var(--primary)" }}>{simulating.status}</span>
              </h2>
              {simulating.code && (
                <p className="text-dim text-xs font-mono">HTTP {simulating.code} — WAF did not intercept</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Grid ── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="glass-card p-6 relative group border-t-2 overflow-hidden" style={{ borderColor: `${s.color}40` }}>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div style={{ padding: "8px", background: `${s.color}10`, color: s.color, borderRadius: 10, border: `1px solid ${s.color}25` }}>{s.icon}</div>
              <div className="text-[9px] font-black text-dim uppercase tracking-widest">Live Relay</div>
            </div>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{s.label}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{(s.value ?? 0).toLocaleString()}</span>
                <span className="text-[10px] font-black" style={{ color: s.color }}>{s.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="quantum-grid">
        {/* Guard Layers */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8 glass-card p-8">
          <h3 className="text-white font-black uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
            <Shield size={18} className="text-success" /> Neural Guard Layers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layers.map((l) => (
              <div key={l.id} className="p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 text-primary">{l.icon}</div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{l.name}</span>
                  </div>
                  <span className={`text-[9px] font-black border px-2 py-0.5 rounded ${l.status === "Active" ? "text-success border-success/30" : "text-dim border-white/10"}`}>
                    {l.status}
                  </span>
                </div>
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${l.health}%` }} className="h-full bg-success" style={{ boxShadow: "0 0 10px var(--success-glow)" }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stress Test + Activity Feed */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-6 border-b-2 border-primary/20">
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <Flame size={18} className="text-primary" /> Security Stress Test
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "SQLI",     label: "SQL Injection", desc: "Query Bypass" },
                { id: "XSS",      label: "XSS Shield",    desc: "Payload Inject" },
                { id: "TRAVERSAL",label: "Path Trans.",    desc: "FS Access" },
                { id: "DOS",      label: "DDoS Spike",     desc: "Flood Sim" }
              ].map((atk) => (
                <button
                  key={atk.id}
                  onClick={() => triggerAttack(atk.id)}
                  className="p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group active:scale-95"
                >
                  <div className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{atk.label}</div>
                  <div className="text-[8px] font-bold text-dim uppercase mt-1">{atk.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-6 flex-1 border-b-2 border-primary/20">
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Terminal size={18} className="text-primary" /> Activity Feed
              <span className="ml-auto text-[8px] font-black text-success border border-success/30 px-2 py-0.5 rounded animate-pulse">LIVE</span>
            </h3>
            <div className="flex flex-col gap-2">
              {displayLogs.length === 0 ? (
                <p className="text-dim text-[10px] font-mono opacity-40 text-center py-4">No activity yet...</p>
              ) : displayLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-white/2 border border-white/5 hover:bg-white/4 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-black text-white">{log.ip}</span>
                    <span className="text-[8px] font-mono text-dim opacity-50">{log.path}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${log.isBlocked ? "bg-danger/20 text-danger border border-danger/20" : "bg-success/20 text-success border border-success/20"}`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rebooting Overlay */}
      <AnimatePresence>
        {rebooting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9999] bg-black/99 backdrop-blur-2xl flex flex-col items-center justify-center p-10">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-32 h-32 rounded-full border-2 border-primary/20 border-t-primary mb-12" />
            <h2 className="text-2xl font-black text-white uppercase tracking-[0.5em] mb-4">Rebooting Neural Link</h2>
            <div className="w-64 bg-white/5 h-1 rounded-full overflow-hidden">
              <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 4 }} className="h-full bg-primary" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
