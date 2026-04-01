import React, { useState } from "react";
import { Download, FileText, ShieldCheck, Mail, Calendar, Clock, CheckCircle2, Lock, BarChart2, Bell, Zap, ChevronRight } from "lucide-react";
import API_BASE from "../config";

export default function Reporting() {
  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState("");
  const [saved, setSaved]       = useState(false);
  const [schedule, setSchedule] = useState("Weekly");

  const handleDownload = async () => {
    setLoading(true);
    try {
      window.location.href = `${API_BASE}/report/download`;
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const handleSaveEmail = () => {
    if (!email.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const reports = [
    {
      icon: <FileText size={20} />,
      iconBg: "rgba(0,242,255,0.08)",
      iconColor: "var(--primary)",
      title: "Security Summary",
      desc: "Complete audit of blocked and allowed requests with IP reputation.",
      actionText: "Download PDF"
    },
    {
      icon: <ShieldCheck size={20} />,
      iconBg: "rgba(255,51,51,0.08)",
      iconColor: "var(--neon-red)",
      title: "Threat Intelligence",
      desc: "Deep analysis of attack vectors and payload signatures.",
      actionText: "Generate Analysis"
    },
    {
      icon: <BarChart2 size={20} />,
      iconBg: "rgba(189,0,255,0.08)",
      iconColor: "var(--secondary)",
      title: "Behavioral Audit",
      desc: "Neural pattern analysis and traffic anomaly detection.",
      actionText: "Review Baselines"
    },
  ];

  const history = [
    { name: "Global_Report_Alpha.pdf", age: "12m ago", size: "2.4 MB" },
    { name: "Node_Audit_Sigma.pdf",  age: "4h ago",  size: "1.8 MB" },
    { name: "Threat_Forensics.pdf",  age: "1d ago",  size: "3.1 MB" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1 overflow-hidden">
      
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
              <FileText className="text-primary" size={24} />
            </div>
            Intelligence Reporting
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)", display: "inline-block" }} className="animate-pulse" />
            Scheduling & Automated Exports
          </p>
        </div>
      </div>

      <div className="quantum-grid">
        {/* Left Column: Report Templates & History */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-white font-black uppercase tracking-widest text-sm">Security Policy Exports</h3>
               <span className="text-[10px] font-mono text-dim">3 TEMPLATES READY</span>
            </div>

            <div className="flex flex-col gap-4">
              {reports.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white/2 border border-white/5 rounded-2xl group hover:bg-white/5 hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div style={{ background: r.iconBg, color: r.iconColor }} className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                       {r.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-wide mb-1">{r.title}</h4>
                      <p className="text-dim text-[11px] leading-relaxed max-w-sm">{r.desc}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-dim group-hover:text-primary group-hover:border-primary/30 transition-all">
                     <Download size={14} />
                     {r.actionText}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-white/5">
               <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-dim" />
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">Recent Activity</span>
               </div>
               <div className="flex flex-col gap-2">
                 {history.map((h, i) => (
                   <div key={i} className="flex items-center justify-between py-2 border-b border-white/2">
                      <span className="text-[11px] font-mono text-white/50">{h.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-dim">{h.size}</span>
                        <span className="text-[10px] font-mono font-bold text-primary">{h.age}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scheduling HUD */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-8 flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-5 blur-[60px]" />
            
            <div className="flex items-center gap-3 mb-8">
              <div style={{ background: "rgba(189,0,255,0.08)", padding: "10px", borderRadius: 12, border: "1px solid rgba(189,0,255,0.2)" }}>
                <Calendar size={20} className="text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Automated Scheduling</h3>
                <p className="text-xs text-dim uppercase tracking-wider font-bold">Recurring Intel Exports</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                 <span className="text-[10px] font-black text-dim uppercase tracking-widest mb-4 block">Select Frequency</span>
                 <div className="flex flex-col gap-2">
                   {["Daily", "Weekly", "Monthly"].map((freq) => (
                     <button 
                      key={freq} 
                      onClick={() => setSchedule(freq)}
                      className={`flex items-center justify-between p-3 px-4 rounded-xl text-[11px] font-bold transition-all ${
                        schedule === freq 
                        ? "bg-secondary/10 text-secondary border border-secondary/30 shadow-[0_0_15px_rgba(189,0,255,0.1)]" 
                        : "text-dim hover:bg-white/5"
                      }`}
                     >
                       {freq} Recap
                       {schedule === freq && <Zap size={14} className="text-secondary" />}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <span className="text-[10px] font-black text-dim uppercase tracking-widest">Network Alert Core</span>
                 <div className="p-1 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 pr-2">
                    <input 
                      type="email" 
                      placeholder="analyst@kluniversity.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-white text-xs px-4 py-3 placeholder:text-dim/30"
                    />
                    <button 
                      onClick={handleSaveEmail}
                      className="p-3 bg-secondary rounded-xl text-black hover:scale-105 transition-all shadow-[0_0_15px_var(--secondary-glow)]"
                    >
                       <Zap size={16} />
                    </button>
                 </div>
                 {saved && <p className="text-[10px] text-secondary font-black uppercase animate-pulse">● System Sync Successful</p>}
              </div>

              <div className="mt-4 p-5 bg-secondary/5 border border-secondary/20 rounded-2xl">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Buffer Sync</span>
                    <span className="text-[10px] font-mono text-secondary font-bold">72%</span>
                 </div>
                 <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary animate-progress w-[72%]" />
                 </div>
                 <p className="text-[9px] text-dim mt-4 uppercase font-bold tracking-widest leading-relaxed">
                   Next automated report scheduled for <span className="text-white">Monday, 04:00 AM</span>
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
