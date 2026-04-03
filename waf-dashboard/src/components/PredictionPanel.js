import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Brain, TrendingUp, AlertTriangle, Shield, Zap,
  ChevronRight, CheckCircle, Info, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import API_BASE from "../config";

const TREND_COLORS  = { rising: "var(--neon-red)", stable: "var(--warning)", falling: "var(--success)" };
const TREND_ICONS   = { rising: "↑", stable: "→", falling: "↓" };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 14 } }
};

function AnomalyGauge({ score }) {
  const clamp = Math.min(100, Math.max(0, score));
  const color = clamp >= 70 ? "var(--neon-red)" : clamp >= 40 ? "var(--warning)" : "var(--success)";
  const label = clamp >= 70 ? "HIGH" : clamp >= 40 ? "MODERATE" : "LOW";

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer decorative rings */}
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-3 rounded-full border border-white/5" />
        {/* Animated fill ring */}
        <svg className="absolute inset-0" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
          <motion.circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 68}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - clamp / 100) }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        {/* Center text */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-4xl font-black text-white">{clamp}</span>
          <span className="text-[9px] font-black text-dim uppercase tracking-widest" style={{ color }}>/ 100</span>
        </div>
      </div>
      <div>
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label} RISK</span>
        </div>
        <p className="text-[9px] text-dim font-mono text-center mt-1 opacity-60">Anomaly Confidence Score</p>
      </div>
    </div>
  );
}

export default function PredictionPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/predictions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const priorityColors = { HIGH: "var(--neon-red)", MEDIUM: "var(--warning)", LOW: "var(--success)" };
  const priorityIcons  = { HIGH: <AlertTriangle size={14} />, MEDIUM: <Info size={14} />, LOW: <CheckCircle size={14} /> };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">
      
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{ background: "rgba(189,0,255,0.08)", borderRadius: 14, border: "1px solid rgba(189,0,255,0.2)" }}>
              <Brain className="text-secondary" size={24} />
            </div>
            AI Prediction Engine
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--secondary)", boxShadow: "0 0 8px var(--secondary)", display: "inline-block" }} />
            Probabilistic Threat Forecasting • Anomaly Detection
          </p>
        </div>
        <div style={{ padding: "10px 18px", background: "rgba(189,0,255,0.06)", border: "1px solid rgba(189,0,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Clock size={14} className="text-secondary" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Auto-refresh: <span className="text-secondary">10s</span>
          </span>
        </div>
      </motion.div>

      {loading && (
        <div className="glass-card p-20 flex flex-col items-center gap-4 opacity-50">
          <div className="w-12 h-12 rounded-full border-2 border-t-secondary animate-spin" />
          <p className="text-dim text-xs font-mono uppercase tracking-widest">Loading prediction engine...</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 border border-danger/30 bg-danger/5">
          <p className="text-danger text-xs font-mono font-black">⚠ Prediction Engine Error: {error}</p>
          <p className="text-dim text-[10px] mt-2">Ensure backend is running: <code className="text-primary">node waf-backend/server.js</code></p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── 7-Day Forecast + Anomaly Gauge ── */}
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
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--neon-red)" }} />
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Blocked</span>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={data.forecast}>
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

              {/* Confidence row */}
              <div className="grid grid-cols-7 gap-1 mt-6">
                {data.forecast.map((d, i) => (
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

            {/* Anomaly Gauge */}
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6 flex-1 flex flex-col items-center justify-center bg-secondary/5 border-secondary/20">
                <div className="flex items-center gap-3 mb-2 w-full">
                  <Zap size={16} className="text-secondary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Anomaly Score</h4>
                </div>
                <AnomalyGauge score={data.anomalyScore} />
              </div>

              <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Quick Stats</h4>
                </div>
                {data.forecast.slice(-1).map((d, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    {[
                      { label: "Today's Predicted Requests", value: d.predicted.toLocaleString(), color: "var(--primary)" },
                      { label: "Predicted Blocks",           value: d.blocked.toLocaleString(),   color: "var(--danger)" },
                      { label: "AI Confidence",              value: `${d.confidence}%`,            color: "var(--secondary)" },
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
            
            {/* Predicted Attack Vectors */}
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
                {data.predictedVectors.map((vec, i) => {
                  const trendColor = TREND_COLORS[vec.trend] || "var(--primary)";
                  return (
                    <div key={i} className="flex items-center gap-4 group">
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
                            style={{ 
                              background: `linear-gradient(90deg, var(--secondary), ${vec.probability > 60 ? "var(--neon-red)" : "var(--warning)"})`,
                              boxShadow: `0 0 10px rgba(189,0,255,0.4)`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Smart Recommendations */}
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5 glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div style={{ background: "rgba(0,242,255,0.08)", padding: 10, borderRadius: 12, border: "1px solid rgba(0,242,255,0.2)" }}>
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">AI Recommendations</h3>
                  <p className="text-xs text-dim uppercase tracking-wider font-bold">Smart action items</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {data.recommendations.map((rec, i) => {
                  const pColor = priorityColors[rec.priority] || "var(--primary)";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 + 0.4 }}
                      className="p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all group cursor-default"
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
    </motion.div>
  );
}
