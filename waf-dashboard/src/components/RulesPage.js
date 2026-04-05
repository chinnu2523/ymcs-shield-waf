import React, { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, Plus, Search, Filter, Lock, Unlock, Zap, Activity, Terminal, CheckCircle2, XCircle } from "lucide-react";

import API_BASE from "../config";

export default function RulesPage({ rules = [], setRules }) {
  const [activeTab, setActiveTab] = useState("all");
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (id, updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        // Optimistic update
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        setEditingRule(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
      }
    } catch (e) {
      console.error("Failed to update rule:", e);
    } finally {
      setSaving(false);
    }
  };

  const filteredRules = (rules && Array.isArray(rules)) 
    ? rules.filter(r => activeTab === "all" || r.type?.toLowerCase() === activeTab)
    : [];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1">
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(0,255,149,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(0,255,149,0.2)",
              boxShadow: "0 4px 20px rgba(0,255,149,0.06)"
            }}>
              <ShieldCheck className="text-success" size={24} />
            </div>
            Security Policy Manager
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", display: "inline-block" }} className="animate-pulse" />
            Configuring Active Defense Protocols
          </p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-4">
        {["all", "waf core", "dynamic", "neural", "policy"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              activeTab === tab 
              ? "bg-primary/10 border-primary/40 text-primary" 
              : "border-white/5 text-dim hover:border-white/20 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Rule Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {filteredRules.map((rule, i) => (
          <div key={rule.id} className="glass-card p-0 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/2">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                     {rule.type === "Neural" ? <Zap size={14} className="text-secondary" /> : <Lock size={14} className="text-primary" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-dim uppercase tracking-[0.2em] opacity-40 mb-1 block">{rule.id}</span>
                    <h3 className="text-white font-black uppercase tracking-widest text-xs group-hover:text-primary transition-colors">{rule.name}</h3>
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                 rule.enabled ? "border-success/30 text-success bg-success/5" : "border-dim/30 text-dim bg-dim/5"
               }`}>
                 {rule.enabled ? "Active" : "Inactive"}
               </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">Logic Layer</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10">{rule.type}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">Enforcement Level</span>
                  <div className="flex gap-1">
                     {[...Array(3)].map((_, idx) => (
                       <div key={idx} className={`w-1.5 h-3 rounded-sm ${idx < (rule.severity === "High" ? 3 : rule.severity === "Medium" ? 2 : 1) ? "bg-primary shadow-[0_0_8px_var(--primary-glow)]" : "bg-white/5"}`} />
                     ))}
                  </div>
               </div>

               <div className="mt-4 pt-4 border-t border-white/5 flex justify-between gap-4">
                 <button 
                  onClick={() => setEditingRule(rule)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black text-dim uppercase tracking-widest transition-all">
                    Configure Parameters
                 </button>
                 <button 
                  onClick={() => handleUpdate(rule.id, { enabled: !rule.enabled })}
                  className={`flex-1 py-3 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    rule.enabled ? "bg-danger/5 hover:bg-danger/10 border-danger/20 text-danger" : "bg-success/5 hover:bg-success/10 border-success/20 text-success"
                  }`}>
                    {rule.enabled ? "Deactivate" : "Activate"}
                 </button>
               </div>
            </div>
            
            {/* Animated background bar */}
            {rule.enabled && (
              <div className="h-[2px] w-full bg-primary/20 relative">
                 <div className="absolute inset-0 bg-primary animate-progress opacity-40" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Configuration Modal ── */}
      {editingRule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20 bg-black/80 animate-fade-in backdrop-blur-sm">
           <div className="glass-card w-full max-w-lg p-10 relative animate-zoom-in max-h-full overflow-y-auto">
              <button 
                onClick={() => setEditingRule(null)}
                className="absolute top-6 right-6 text-dim hover:text-white"
              >
                <XCircle size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Terminal className="text-primary" size={24} />
                 </div>
                 <div>
                    <h2 className="text-white font-black uppercase tracking-widest text-lg">Rule Configuration</h2>
                    <p className="text-dim text-[10px] font-black uppercase tracking-wider">{editingRule.id} • {editingRule.name}</p>
                 </div>
              </div>

              <div className="flex flex-col gap-8">
                 <div className="p-6 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-black text-white uppercase tracking-widest">Enforcement Status</span>
                       <button 
                        onClick={() => handleUpdate(editingRule.id, { enabled: !editingRule.enabled })}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                          editingRule.enabled ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"
                        }`}
                       >
                         {editingRule.enabled ? "Enabled" : "Disabled"}
                       </button>
                    </div>
                    <p className="text-[10px] text-dim font-bold leading-relaxed uppercase tracking-wider opacity-60">
                       When disabled, requests matching this pattern will bypass the filter and will only be logged for audit purposes.
                    </p>
                 </div>

                 <div className="p-6 rounded-xl bg-white/3 border border-white/5">
                    <span className="text-xs font-black text-white uppercase tracking-widest block mb-4">Sensitivity Level</span>
                    <div className="flex gap-3">
                       {["Low", "Medium", "High"].map(level => (
                         <button 
                          key={level}
                          onClick={() => handleUpdate(editingRule.id, { severity: level })}
                          className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                            editingRule.severity === level ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-dim"
                          }`}
                         >
                           {level}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                  onClick={() => setEditingRule(null)}
                  className="w-full py-4 mt-4 bg-primary text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:scale-[1.02] transition-transform active:scale-95"
                 >
                   Save & Apply Changes
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}