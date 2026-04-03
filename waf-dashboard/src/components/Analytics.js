import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Activity, Shield, TrendingUp, AlertTriangle, Cpu, Globe, PieChart, Zap } from "lucide-react";
import ThreatMap from "./ThreatMap";

export default function Analytics({ counters, history, threats }) {
  // Map history arrays to Recharts format
  const chartData = (history?.allowed || []).map((val, i) => ({
    time: `T-${20 - i}`,
    requests: val + (history?.blocked?.[i] || 0),
    blocked: history?.blocked?.[i] || 0
  }));

  // Compute real attack type distribution from live threat data
  const typeFreq = {};
  (threats || []).forEach(t => {
    const type = t.type || "Unknown";
    typeFreq[type] = (typeFreq[type] || 0) + 1;
  });
  const LIVE_COLORS = ["var(--neon-blue)", "var(--secondary)", "var(--neon-red)", "var(--warning)", "var(--primary)"];
  const liveAttackTypes = Object.entries(typeFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value, color: LIVE_COLORS[i % LIVE_COLORS.length] }));
  
  // Fallback demo data when no threats yet
  const attackTypes = liveAttackTypes.length > 0 ? liveAttackTypes : [
    { name: "SQLi",   value: 0, color: "var(--neon-blue)" },
    { name: "XSS",    value: 0, color: "var(--secondary)" },
    { name: "DDoS",   value: 0, color: "var(--neon-red)"  },
    { name: "Other",  value: 0, color: "var(--warning)"   },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1">
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(189,0,255,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(189,0,255,0.2)",
              boxShadow: "0 4px 20px rgba(189,0,255,0.06)"
            }}>
              <TrendingUp className="text-secondary" size={24} />
            </div>
            Threat Analytics
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--secondary)", boxShadow: "0 0 8px var(--secondary)", display: "inline-block" }} className="animate-pulse" />
            Neural Pattern recognition &amp; Signal Intelligence
          </p>
        </div>
      </div>

      <div className="quantum-grid">
        {/* Left: Main Area Chart */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 min-h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div style={{ background: "rgba(0,242,255,0.06)", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <Activity size={16} className="text-primary" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Packet Throughput
                  </h3>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
                    Real-time Request Analytics (Moving Window)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Total Req</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-danger" />
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Mitigated</span>
                 </div>
              </div>
            </div>

            <div className="flex-1" style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--neon-red)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--neon-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--text-dim)", fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--text-dim)", fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(5,7,10,0.95)", 
                      borderColor: "rgba(255,255,255,0.1)", 
                      borderRadius: "12px",
                      backdropFilter: "blur(40px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#fff"
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="blocked" stroke="var(--neon-red)" strokeWidth={3} fillOpacity={1} fill="url(#colorBlocked)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Global Threat Matrix (Integrated Map) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <ThreatMap threats={threats || []} />
        </div>
      </div>

      {/* ── Two Column Bottom Section ── */}
      <div className="quantum-grid">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="glass-card p-8 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-3 mb-8">
              <div style={{ background: "rgba(245,158,11,0.08)", padding: "10px", borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)" }}>
                <PieChart size={20} className="text-warning" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Threat Vector Distribution</h3>
                <p className="text-xs text-dim uppercase tracking-wider font-bold">Attack signature breakdown</p>
              </div>
            </div>

            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={attackTypes} layout="vertical" barSize={32}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: "var(--text-main)", fontSize: 11, fontWeight: 900 }}
                    width={70}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ backgroundColor: "rgba(5,7,10,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {attackTypes.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-8 flex flex-col justify-center items-center text-center relative overflow-hidden flex-1">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundSize: "20px 20px", backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)" }} />
             
             <div className="relative z-10 mb-6">
               <Zap size={40} className="text-secondary animate-pulse" />
             </div>
             <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs mb-3 z-10">Neural Intelligence Core</h4>
             <p className="text-[10px] text-dim uppercase tracking-widest leading-relaxed max-w-[200px] z-10">
               Analyzing packet signatures for anomalous behavior patterns...
             </p>

             <div className="mt-8 flex gap-2 z-10">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="w-1.5 h-10 rounded-full bg-secondary opacity-20 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}