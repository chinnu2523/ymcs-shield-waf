import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Users, Globe, Target, Shield, TrendingUp, AlertTriangle, 
  Clock, Cpu, ChevronRight, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import API_BASE from "../config";

const RISK_COLORS = ["var(--neon-red)", "var(--danger)", "var(--warning)", "var(--success)"];

function getRiskColor(score) {
  if (score >= 80) return "var(--neon-red)";
  if (score >= 60) return "var(--danger)";
  if (score >= 30) return "var(--warning)";
  return "var(--success)";
}

function getRiskLabel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 14 } }
};

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIP, setSelectedIP] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/userdashboard`);
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
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Summary metrics
  const totalIPs    = data?.topAttackers?.length ?? 0;
  const criticalIPs = data?.topAttackers?.filter(a => a.riskScore >= 80).length ?? 0;
  const topAttackType = data?.attackBreakdown?.[0]?.name ?? "N/A";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">
      
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{ background: "rgba(0,242,255,0.08)", borderRadius: 14, border: "1px solid rgba(0,242,255,0.2)" }}>
              <Users className="text-primary" size={24} />
            </div>
            User Intelligence
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)", display: "inline-block" }} />
            Per-IP Analytics & Threat Attribution
          </p>
        </div>
        <div style={{ padding: "10px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Activity size={14} className="text-primary" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Live: <span className="text-success">{totalIPs} Tracked IPs</span>
          </span>
        </div>
      </motion.div>

      {/* ── Summary Data Cards ── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Unique Source IPs",   value: totalIPs,       unit: "NODES",   icon: <Globe size={18} />,        color: "var(--primary)",   desc: "Distinct sources tracked" },
          { label: "Critical Risk IPs",   value: criticalIPs,    unit: "FLAGGED", icon: <AlertTriangle size={18} />, color: "var(--danger)",    desc: "Risk score ≥ 80%" },
          { label: "Top Attack Vector",   value: topAttackType,  unit: "",        icon: <Target size={18} />,       color: "var(--secondary)", desc: "Most frequent threat type" },
        ].map((card, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -4 }} className="glass-card p-6 border-t-2 overflow-hidden relative" style={{ borderColor: `${card.color}40` }}>
            <div className="flex justify-between items-start mb-4">
              <div style={{ padding: "8px", background: `${card.color}10`, color: card.color, borderRadius: 10, border: `1px solid ${card.color}25` }}>{card.icon}</div>
              <div className="text-[8px] font-black text-dim uppercase tracking-widest opacity-50">{card.desc}</div>
            </div>
            <h4 className="text-[10px] font-black text-dim uppercase tracking-widest mb-2">{card.label}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</span>
              {card.unit && <span className="text-[10px] font-black" style={{ color: card.color }}>{card.unit}</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {loading && (
        <div className="glass-card p-20 flex flex-col items-center gap-4 opacity-50">
          <div className="w-12 h-12 rounded-full border-2 border-t-primary animate-spin" />
          <p className="text-dim text-xs font-mono uppercase tracking-widest">Loading intelligence data...</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 border border-danger/30 bg-danger/5">
          <p className="text-danger text-xs font-mono font-black">⚠ Backend Error: {error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="quantum-grid">
            {/* Top Attackers Leaderboard */}
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8 glass-card p-0 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center">
                    <Target className="text-danger" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">Top Threat Actors</h3>
                    <p className="text-xs text-dim uppercase tracking-wider font-bold">Ranked by blocked request count</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-danger border border-danger/20 px-2 py-1 rounded animate-pulse">LIVE FEED</span>
              </div>

              {data.topAttackers.length === 0 ? (
                <div className="p-16 text-center opacity-30">
                  <Shield size={32} className="mx-auto mb-4 text-dim" />
                  <p className="text-dim text-xs font-mono uppercase">No threat actors detected</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Header row */}
                  <div className="px-8 py-3 grid grid-cols-5 text-[9px] font-black text-dim uppercase tracking-widest border-b border-white/5 bg-white/1">
                    <span>Source IP</span>
                    <span>Requests</span>
                    <span>Blocked</span>
                    <span>Top Attack</span>
                    <span>Risk</span>
                  </div>
                  {data.topAttackers.map((attacker, i) => {
                    const riskColor = getRiskColor(attacker.riskScore);
                    const isSelected = selectedIP === attacker.ip;
                    return (
                      <motion.div
                        key={attacker.ip}
                        onClick={() => setSelectedIP(isSelected ? null : attacker.ip)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`px-8 py-5 grid grid-cols-5 items-center border-b border-white/5 cursor-pointer transition-all ${isSelected ? "bg-white/6 border-l-2" : "hover:bg-white/3"}`}
                        style={isSelected ? { borderLeftColor: riskColor } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-dim opacity-40 w-5">#{i + 1}</span>
                          <span className="text-xs font-mono font-black text-white">{attacker.ip}</span>
                        </div>
                        <span className="text-sm font-black text-white">{attacker.total.toLocaleString()}</span>
                        <span className="text-sm font-black" style={{ color: "var(--danger)" }}>{attacker.blocked.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-dim uppercase truncate">{attacker.topAttack}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${attacker.riskScore}%` }}
                              transition={{ delay: i * 0.05 + 0.3 }}
                              className="h-full rounded-full"
                              style={{ background: riskColor, boxShadow: `0 0 8px ${riskColor}` }}
                            />
                          </div>
                          <span className="text-[9px] font-black" style={{ color: riskColor, minWidth: 50 }}>
                            {getRiskLabel(attacker.riskScore)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Country Distribution */}
            <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6 flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Globe size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Origin Distribution</h4>
                </div>
                <div className="flex flex-col gap-3">
                  {(data.countryStats.length > 0 ? data.countryStats : [{ country: "Localhost", count: 1 }]).map((c, i) => {
                    const maxCount = data.countryStats[0]?.count || 1;
                    const pct = Math.round((c.count / maxCount) * 100);
                    const color = RISK_COLORS[i % RISK_COLORS.length];
                    return (
                      <div key={c.country} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white">{c.country}</span>
                          <span className="text-[10px] font-mono text-dim">{c.count}</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: i * 0.06 + 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attack Breakdown */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu size={16} className="text-secondary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Attack Type Breakdown</h4>
                </div>
                {data.attackBreakdown.length === 0 ? (
                  <p className="text-dim text-[10px] font-mono opacity-40">No attacks recorded</p>
                ) : (
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.attackBreakdown.slice(0, 5)} layout="vertical" barSize={18}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                          tick={{ fill: "var(--text-main)", fontSize: 9, fontWeight: 900 }} width={80} />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          contentStyle={{ backgroundColor: "rgba(5,7,10,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {data.attackBreakdown.slice(0, 5).map((_, i) => (
                            <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Last Seen Timeline (for selected IP) */}
          {selectedIP && data.topAttackers.find(a => a.ip === selectedIP) && (() => {
            const attacker = data.topAttackers.find(a => a.ip === selectedIP);
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <ChevronRight className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">IP Intelligence: <span className="text-primary font-mono">{attacker.ip}</span></h3>
                    <p className="text-xs text-dim uppercase tracking-wider font-bold">Detailed threat profile</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Total Requests",  value: attacker.total,                           color: "var(--primary)" },
                    { label: "Blocked",          value: attacker.blocked,                          color: "var(--danger)" },
                    { label: "Risk Score",       value: `${attacker.riskScore}%`,                 color: getRiskColor(attacker.riskScore) },
                    { label: "Top Attack Type",  value: attacker.topAttack || "Unknown",          color: "var(--secondary)" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-dim uppercase tracking-widest">{item.label}</span>
                      <span className="text-xl font-black" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}
        </>
      )}
    </motion.div>
  );
}
