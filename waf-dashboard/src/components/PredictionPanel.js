import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Brain, TrendingUp, AlertTriangle, Shield, Zap,
  ChevronRight, CheckCircle, Info, Clock, Activity,
  Database, Server, Globe, RefreshCw, Cpu, AlertOctagon,
  ShieldCheck, Lock, Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE from "../config";

// ─── Utility ──────────────────────────────────────────────────────────────
const TREND_COLORS  = { rising: "var(--neon-red)", stable: "var(--warning)", falling: "var(--success)" };
const TREND_ICONS   = { rising: "↑", stable: "→", falling: "↓" };

const STATUS_CONFIG = {
  ONLINE:       { color: "var(--success)",   glow: "var(--success)",    label: "ONLINE",      dot: "bg-success" },
  OFFLINE:      { color: "var(--neon-red)",  glow: "var(--neon-red)",   label: "OFFLINE",     dot: "bg-danger" },
  CONNECTING:   { color: "var(--warning)",   glow: "var(--warning)",    label: "CONNECTING",  dot: "bg-warning" },
  DEGRADED:     { color: "var(--warning)",   glow: "var(--warning)",    label: "DEGRADED",    dot: "bg-warning" },
  ACTIVE:       { color: "var(--success)",   glow: "var(--success)",    label: "ACTIVE",      dot: "bg-success" },
  UNKNOWN:      { color: "var(--text-dim)",  glow: "transparent",       label: "UNKNOWN",     dot: "bg-white/20" },
};

function getConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG["UNKNOWN"];
}

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
};
const itemVariants = {
  hidden:  { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 14 } }
};

// ─── Animated Anomaly Gauge ───────────────────────────────────────────────
function AnomalyGauge({ score }) {
  const clamp = Math.min(100, Math.max(0, score));
  const color = clamp >= 70 ? "var(--neon-red)" : clamp >= 40 ? "var(--warning)" : "var(--success)";
  const label = clamp >= 70 ? "HIGH" : clamp >= 40 ? "MODERATE" : "LOW";
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-3 rounded-full border border-white/5" />
        <svg className="absolute inset-0" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
          <motion.circle
            cx="80" cy="80" r="68" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 68}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - clamp / 100) }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-4xl font-black text-white">{clamp}</span>
          <span className="text-[9px] font-black text-dim uppercase tracking-widest" style={{ color }}>/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label} RISK</span>
        <p className="text-[9px] text-dim font-mono text-center mt-1 opacity-60">Anomaly Confidence Score</p>
      </div>
    </div>
  );
}

// ─── Service Status Card ──────────────────────────────────────────────────
function ServiceCard({ icon, label, status, latency, detail, index }) {
  const cfg = getConfig(status);
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="glass-card p-6 relative overflow-hidden border-t-2"
      style={{ borderColor: `${cfg.color}40` }}
    >
      {/* Pulsing background glow */}
      <motion.div
        animate={{ opacity: [0.04, 0.12, 0.04] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: index * 0.4 }}
        className="absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}30, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border"
            style={{ background: `${cfg.color}10`, borderColor: `${cfg.color}25`, color: cfg.color }}>
            {icon}
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.3 }}
              className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}
              style={{ boxShadow: `0 0 8px ${cfg.color}` }}
            />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>
        <h4 className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{label}</h4>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black text-white">{status}</span>
        </div>
        {latency !== undefined && (
          <p className="text-[10px] font-mono text-dim opacity-50">
            Latency: <span className="text-white">{latency}ms</span>
          </p>
        )}
        {detail && (
          <p className="text-[10px] font-mono text-dim opacity-40 mt-1 truncate" title={detail}>{detail}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Live Heal Log Feed ───────────────────────────────────────────────────
function HealLog({ entries }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [entries]);

  const severityStyles = {
    critical: { border: "border-danger/30",  bg: "bg-danger/5",   text: "text-danger",  icon: <AlertOctagon size={12} /> },
    warning:  { border: "border-warning/30", bg: "bg-warning/5",  text: "text-warning", icon: <AlertTriangle size={12} /> },
    info:     { border: "border-success/30", bg: "bg-success/5",  text: "text-success", icon: <CheckCircle size={12} /> },
  };

  return (
    <div ref={scrollRef} className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
      <AnimatePresence initial={false}>
        {entries.length === 0 ? (
          <div className="text-center py-8 opacity-30">
            <Shield size={24} className="mx-auto mb-2 text-dim" />
            <p className="text-dim text-[10px] font-mono uppercase">No actions taken yet</p>
          </div>
        ) : entries.map((e) => {
          const sty = severityStyles[e.severity] || severityStyles.info;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0,   height: "auto" }}
              className={`p-4 rounded-xl border ${sty.border} ${sty.bg} flex gap-3 items-start`}
            >
              <div className={`mt-0.5 shrink-0 ${sty.text}`}>{sty.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-black text-white truncate">{e.action}</p>
                  <span className="text-[9px] font-mono text-dim shrink-0 opacity-50">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={`text-[10px] font-bold mt-0.5 ${sty.text}`}>{e.reason}</p>
                {e.detail && (
                  <p className="text-[9px] font-mono text-dim opacity-50 mt-0.5 truncate" title={e.detail}>{e.detail}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function PredictionPanel() {
  const [predData,  setPredData]  = useState(null);
  const [sysHealth, setSysHealth] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAll = async () => {
    try {
      const [predRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/predictions`),
        fetch(`${API_BASE}/system/health`)
      ]);

      if (!predRes.ok)   throw new Error(`Predictions: HTTP ${predRes.status}`);
      if (!healthRes.ok) throw new Error(`Health: HTTP ${healthRes.status}`);

      const [pred, health] = await Promise.all([predRes.json(), healthRes.json()]);
      setPredData(pred);
      setSysHealth(health);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const priorityColors = { HIGH: "var(--neon-red)", MEDIUM: "var(--warning)", LOW: "var(--success)" };
  const priorityIcons  = {
    HIGH:   <AlertTriangle size={14} />,
    MEDIUM: <Info size={14} />,
    LOW:    <CheckCircle size={14} />
  };

  // Derive frontend status (always "ONLINE" since we're rendering)
  const frontendStatus = "ONLINE";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">

      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{ background: "rgba(189,0,255,0.08)", borderRadius: 14, border: "1px solid rgba(189,0,255,0.2)" }}>
              <Brain className="text-secondary" size={24} />
            </div>
            AI Prediction & Monitor
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--secondary)", boxShadow: "0 0 8px var(--secondary)", display: "inline-block" }}
            />
            Autonomous Monitoring • Adaptive security engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[9px] font-mono text-dim opacity-40">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            onClick={fetchAll}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 glass-card border border-white/10 hover:border-primary/40 transition-all"
            style={{ borderRadius: 10, fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}
          >
            <motion.div
              animate={loading ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <RefreshCw size={12} />
            </motion.div>
            Refresh
          </motion.button>
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className="flex items-center gap-2 px-4 py-2 border transition-all"
            style={{
              borderRadius: 10, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
              background: autoRefresh ? "rgba(0,242,255,0.08)" : "rgba(255,255,255,0.03)",
              borderColor: autoRefresh ? "rgba(0,242,255,0.3)" : "rgba(255,255,255,0.08)",
              color: autoRefresh ? "var(--primary)" : "var(--text-dim)"
            }}
          >
            {autoRefresh ? <Activity size={12} /> : <Clock size={12} />}
            {autoRefresh ? "Auto: ON" : "Auto: OFF"}
          </button>
        </div>
      </motion.div>

      {/* ── System Status Cards with Live Scan Pulse ── */}
      <motion.div variants={itemVariants} className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Server size={14} className="text-primary" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live System Status</h3>
            <span className="text-[8px] font-black text-success border border-success/30 px-2 py-0.5 rounded animate-pulse">
              AUTO-MONITOR ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Security Drone</span>
            <div className="flex gap-1">
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.8 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
        </div>

        {/* Live Scanner Sweep Animation */}
        <div className="absolute left-0 right-0 top-12 bottom-0 z-50 pointer-events-none overflow-hidden rounded-2xl">
           <motion.div 
             animate={{ x: ["-10%", "110%", "-10%"] }} 
             transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
             className="w-1 h-full bg-primary/40 blur-[2px]"
             style={{ boxShadow: "0 0 40px 10px rgba(0, 242, 255, 0.15)" }}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ServiceCard
            index={0}
            icon={<Server size={18} />}
            label="Backend Engine"
            status={sysHealth?.backend?.status || (loading ? "CONNECTING" : "OFFLINE")}
            latency={sysHealth?.backend?.uptime ? undefined : 0}
            detail={sysHealth ? `Uptime: ${Math.floor((sysHealth.backend?.uptime || 0) / 60)}m ${(sysHealth.backend?.uptime || 0) % 60}s` : "Checking..."}
          />
          <ServiceCard
            index={1}
            icon={<Database size={18} />}
            label="Database Layer"
            status={sysHealth?.database?.status || (loading ? "CONNECTING" : "OFFLINE")}
            latency={sysHealth?.database?.latencyMs}
            detail={sysHealth?.database?.error || (sysHealth?.database?.status === "ONLINE" ? "MongoDB connected" : "In-memory fallback active")}
          />
          <ServiceCard
            index={2}
            icon={<Globe size={18} />}
            label="Frontend Interface"
            status={frontendStatus}
            detail="React SPA • GitHub Pages"
          />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="glass-card p-6 border border-danger/30 bg-danger/5">
          <p className="text-danger text-xs font-mono font-black">⚠ Monitor Error: {error}</p>
          <p className="text-dim text-[10px] mt-1">Ensure backend is running: <code className="text-primary">node server.js</code></p>
        </motion.div>
      )}

      {/* ── Adaptive Security State ── */}
      {sysHealth && (
        <motion.div variants={itemVariants} className="quantum-grid">
          {/* Adaptive Security Metrics */}
          <div className="col-span-12 lg:col-span-8 glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ background: "rgba(189,0,255,0.08)", padding: 8, borderRadius: 10, border: "1px solid rgba(189,0,255,0.2)" }}>
                <Cpu size={16} className="text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Adaptive Security Engine</h3>
                <p className="text-xs text-dim uppercase tracking-wider font-bold">Self-tuning thresholds • Live attack learning</p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
                  <RefreshCw size={10} className="text-secondary" />
                </motion.div>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">SELF-TUNING</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Rate Limit",
                  value: sysHealth.adaptive?.rateLimitThreshold ?? 200,
                  unit: "req/2min",
                  color: "var(--primary)",
                  icon: <Zap size={14} />,
                  desc: "Auto-tuned threshold"
                },
                {
                  label: "Auto-Blocked IPs",
                  value: sysHealth.adaptive?.tempBlockedIPs ?? 0,
                  unit: "IPs",
                  color: "var(--neon-red)",
                  icon: <Lock size={14} />,
                  desc: "15-min temp blocklist"
                },
                {
                  label: "WAF Checks",
                  value: sysHealth.waf?.totalChecks ?? 0,
                  unit: "total",
                  color: "var(--success)",
                  icon: <ShieldCheck size={14} />,
                  desc: "Total inspections"
                },
                {
                  label: "System Load",
                  value: sysHealth.system?.cpuLoad ?? 0,
                  unit: "load avg",
                  color: sysHealth.system?.cpuLoad > 3 ? "var(--danger)" : "var(--warning)",
                  icon: <Cpu size={14} />,
                  desc: "1-min CPU average"
                },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-2 mb-3" style={{ color: m.color }}>
                    {m.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{m.desc}</span>
                  </div>
                  <h4 className="text-[9px] font-black text-dim uppercase tracking-widest mb-1">{m.label}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                    </span>
                    <span className="text-[9px] font-black" style={{ color: m.color }}>{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Attack Window Summary */}
            <div>
              <h4 className="text-[10px] font-black text-dim uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity size={12} className="text-primary" />
                5-Min Attack Window
                <span className="opacity-40 font-mono">since {new Date(sysHealth.adaptive?.windowStarted || Date.now()).toLocaleTimeString()}</span>
              </h4>
              {Object.keys(sysHealth.adaptive?.attackWindowSummary || {}).length === 0 ? (
                <div className="py-4 text-center opacity-30">
                  <ShieldCheck size={20} className="mx-auto mb-2 text-success" />
                  <p className="text-[10px] font-mono text-dim uppercase">No attacks in current window — all clear</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(sysHealth.adaptive?.attackWindowSummary || {}).map(([type, count], i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-danger/20 bg-danger/5">
                      <span className="text-[10px] font-bold text-white truncate">{type}</span>
                      <span className="text-sm font-black text-danger ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Memory & System Panel */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Memory */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cpu size={14} className="text-primary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">System Resources</h4>
              </div>
              {sysHealth.system && (() => {
                const memPct = Math.round((sysHealth.system.memUsedMB / sysHealth.system.memTotalMB) * 100) || 0;
                const memColor = memPct > 85 ? "var(--neon-red)" : memPct > 60 ? "var(--warning)" : "var(--success)";
                return (
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Memory Used",    value: `${sysHealth.system.memUsedMB} MB`, pct: memPct, color: memColor },
                      { label: "CPU Load Avg",   value: `${sysHealth.system.cpuLoad}`,       pct: Math.min(100, sysHealth.system.cpuLoad * 10), color: sysHealth.system.cpuLoad > 3 ? "var(--danger)" : "var(--primary)" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-dim uppercase tracking-wider">{item.label}</span>
                          <span className="text-white font-black">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between text-[9px] font-mono">
                      <span className="text-dim">Node {sysHealth.system.nodeVersion}</span>
                      <span className="text-dim">Uptime: {Math.floor((sysHealth.backend?.uptime || 0) / 60)}m</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Auto-Heal Log */}
            <div className="glass-card p-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={14} className="text-success" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Heal Log</h4>
                <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-success">
                  {sysHealth.adaptationLog?.length || 0} EVENTS
                </span>
              </div>
              <HealLog entries={sysHealth.adaptationLog || []} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Divider ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[9px] font-black text-dim uppercase tracking-[0.3em] opacity-40">Threat Forecast</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* ── 7-Day Forecast + Anomaly Gauge ── */}
      {!loading && !error && predData && (
        <>
          <div className="quantum-grid">
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8 glass-card p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div style={{ background: "rgba(0,242,255,0.06)", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <TrendingUp size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      7-Day Threat Forecast
                    </h3>
                    <span style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
                      AI-Modeled Traffic Projection
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Predicted Total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--neon-red)" }} />
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Predicted Blocked</span>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={predData.forecast}>
                    <defs>
                      <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--primary)"  stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)"  stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--neon-red)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--neon-red)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-dim)", fontSize: 10, fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-dim)", fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(5,7,10,0.95)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, fontWeight: "bold", color: "#fff" }}
                      formatter={(val, name) => [val, name === "predicted" ? "Predicted Total" : "Predicted Blocked"]}
                    />
                    <Area type="monotone" dataKey="predicted" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradPredicted)" />
                    <Area type="monotone" dataKey="blocked"   stroke="var(--neon-red)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradBlocked)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-7 gap-1 mt-6">
                {predData.forecast.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-[8px] font-bold text-dim">{d.confidence}%</div>
                    <div className="w-full h-1 rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${d.confidence}%`, opacity: 0.6 }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-dim text-center mt-2 font-mono opacity-40">AI Confidence per day</p>
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6 flex-1 flex flex-col items-center justify-center bg-secondary/5 border-secondary/20">
                <div className="flex items-center gap-3 mb-2 w-full">
                  <Zap size={16} className="text-secondary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Anomaly Score</h4>
                </div>
                <AnomalyGauge score={predData.anomalyScore} />
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Today's Forecast</h4>
                </div>
                {predData.forecast.slice(-1).map((d, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    {[
                      { label: "Predicted Requests", value: d.predicted.toLocaleString(), color: "var(--primary)" },
                      { label: "Predicted Blocks",   value: d.blocked.toLocaleString(),   color: "var(--danger)" },
                      { label: "AI Confidence",       value: `${d.confidence}%`,           color: "var(--secondary)" },
                    ].map((item, j) => (
                      <div key={j} className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-dim uppercase tracking-wider">{item.label}</span>
                        <span className="text-sm font-black" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Predicted Vectors + Recommendations ── */}
          <div className="quantum-grid">
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-7 glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div style={{ background: "rgba(189,0,255,0.08)", padding: 10, borderRadius: 12, border: "1px solid rgba(189,0,255,0.2)" }}>
                  <Brain size={18} className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Predicted Attack Vectors</h3>
                  <p className="text-xs text-dim uppercase tracking-wider font-bold">Probability-ranked threat forecast</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {predData.predictedVectors.map((vec, i) => {
                  const trendColor = TREND_COLORS[vec.trend] || "var(--primary)";
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[9px] font-black text-dim opacity-40 w-4">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-black text-white uppercase tracking-wider">{vec.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black" style={{ color: trendColor }}>
                              {TREND_ICONS[vec.trend]} {vec.trend.toUpperCase()}
                            </span>
                            <span className="text-sm font-black text-white">{vec.probability}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${vec.probability}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, var(--secondary), ${vec.probability > 60 ? "var(--neon-red)" : "var(--warning)"})`, boxShadow: "0 0 10px rgba(189,0,255,0.4)" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5 glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div style={{ background: "rgba(0,242,255,0.08)", padding: 10, borderRadius: 12, border: "1px solid rgba(0,242,255,0.2)" }}>
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">AI Recommendations</h3>
                  <p className="text-xs text-dim uppercase tracking-wider font-bold">Auto-adapt action items</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {predData.recommendations.map((rec, i) => {
                  const pColor = priorityColors[rec.priority] || "var(--primary)";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 + 0.4 }}
                      className="p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all group"
                      style={{ borderLeft: `2px solid ${pColor}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2" style={{ color: pColor }}>
                          {priorityIcons[rec.priority]}
                          <span className="text-[9px] font-black uppercase tracking-widest">{rec.priority}</span>
                        </div>
                        <ChevronRight size={14} className="text-dim group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-[12px] font-bold text-white mb-1">{rec.action}</p>
                      <p className="text-[10px] font-mono text-dim opacity-60">{rec.reason}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {loading && (
        <div className="glass-card p-20 flex flex-col items-center gap-4 opacity-50">
          <div className="w-12 h-12 rounded-full border-2 border-t-secondary animate-spin" />
          <p className="text-dim text-xs font-mono uppercase tracking-widest">Initializing prediction engine & monitor...</p>
        </div>
      )}
    </motion.div>
  );
}
