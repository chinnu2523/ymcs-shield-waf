import React, { useState, useEffect } from "react";
import { Settings, Sliders, Clock, Database, Mail, HardDrive, ShieldCheck, Activity, AlertTriangle, Eye, Save } from "lucide-react";
import API_BASE from "../config";

export default function SettingsPage() {
  const [activeMode, setActiveMode] = useState(2); // 0=Monitor, 1=Detection, 2=Prevention
  const [loading, setLoading] = useState(true);
  
  const [sysConfig, setSysConfig] = useState({
    "Rate Limit Threshold": "100 req/min",
    "Block Duration": "10 minutes",
    "Log Retention": "30 days",
    "Alert Email": "admin@quantumguard.com",
    "Max Payload Size": "10 MB"
  });

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.activeMode !== undefined) setActiveMode(Number(data.activeMode));
        setSysConfig(prev => ({ ...prev, ...data }));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const saveSettings = async (key, val) => {
    setSysConfig(prev => ({ ...prev, [key]: val }));
    await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: val })
    });
  };

  const handleModeSwitch = async (i) => {
    setActiveMode(i);
    await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMode: i })
    });
  };

  const configsFields = [
    { key: "Rate Limit Threshold", color: "var(--primary)",   bg: "rgba(0,242,255,0.07)",    icon: <Sliders size={16} /> },
    { key: "Block Duration",       color: "var(--secondary)", bg: "rgba(189,0,255,0.07)",    icon: <Clock size={16} /> },
    { key: "Log Retention",        color: "var(--success)",   bg: "rgba(0,255,149,0.07)",    icon: <Database size={16} /> },
    { key: "Alert Email",          color: "var(--warning)",   bg: "rgba(245,158,11,0.07)",   icon: <Mail size={16} /> },
    { key: "Max Payload Size",     color: "#f59e0b",          bg: "rgba(245,158,11,0.07)",   icon: <HardDrive size={16} /> },
  ];

  const modes = [
    {
      label: "Monitor Only",
      desc: "Passive observation, no blocking",
      icon: <Eye size={18} />,
      color: "var(--text-dim)",
      activeColor: "var(--primary)",
      activeBg: "rgba(0,242,255,0.10)",
      activeBorder: "rgba(0,242,255,0.35)",
    },
    {
      label: "Detection Mode",
      desc: "Logs threats without blocking",
      icon: <AlertTriangle size={18} />,
      color: "var(--text-dim)",
      activeColor: "var(--warning)",
      activeBg: "rgba(245,158,11,0.10)",
      activeBorder: "rgba(245,158,11,0.35)",
    },
    {
      label: "Prevention Mode",
      desc: "Full blocking — recommended",
      icon: <ShieldCheck size={18} />,
      color: "var(--text-dim)",
      activeColor: "var(--success)",
      activeBg: "rgba(0,255,149,0.10)",
      activeBorder: "rgba(0,255,149,0.35)",
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{
              background: "rgba(0,242,255,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(0,242,255,0.2)",
              boxShadow: "0 4px 20px rgba(0,242,255,0.06)"
            }}>
              <Settings className="text-primary" size={24} style={{ animation: "spin 8s linear infinite" }} />
            </div>
            System Configuration
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)", display: "inline-block" }} className="animate-pulse" />
            WAF Engine Parameters &amp; Policy Controls
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10
        }}>
          <Activity size={13} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Config Sync: <span style={{ color: "var(--success)" }}>APPLIED</span>
          </span>
        </div>
      </div>

      {/* Configuration Rows */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ padding: "7px 9px", background: "rgba(0,242,255,0.06)", borderRadius: 10, border: "1px solid rgba(0,242,255,0.15)" }}>
            <Sliders size={16} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Engine Parameters</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>
              Live configuration values
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {configsFields.map((c, i) => (
            <div key={c.key} className="settings-row stagger-1" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, border: `1px solid ${c.color}25`, flexShrink: 0 }}>
                  {c.icon}
                </div>
                <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 14 }}>{c.key}</span>
              </div>
              <input
                type="text"
                value={sysConfig[c.key]}
                onChange={(e) => setSysConfig(prev => ({ ...prev, [c.key]: e.target.value }))}
                onBlur={(e) => saveSettings(c.key, e.target.value)}
                className="settings-badge bg-transparent outline-none text-right"
                style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30`, minWidth: "120px", cursor: "text" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* WAF Mode Selector */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ padding: "7px 9px", background: "rgba(189,0,255,0.08)", borderRadius: 10, border: "1px solid rgba(189,0,255,0.20)" }}>
            <ShieldCheck size={16} style={{ color: "var(--secondary)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.15em" }}>WAF Operational Mode</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>
              Select enforcement policy
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
          {modes.map((m, i) => {
            const isActive = activeMode === i;
            return (
              <button
                key={m.label}
                onClick={() => handleModeSwitch(i)}
                className={`settings-mode-btn${isActive ? " active" : ""}`}
                style={isActive ? {
                  background: m.activeBg,
                  borderColor: m.activeBorder,
                  color: m.activeColor,
                  boxShadow: `0 0 20px ${m.activeBorder.replace("0.35", "0.10")}`
                } : {}}
              >
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isActive ? m.activeBg : "rgba(255,255,255,0.04)",
                    border: isActive ? `1px solid ${m.activeBorder}` : "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isActive ? m.activeColor : "var(--text-dim)",
                    transition: "all 0.3s ease",
                    margin: "0 auto"
                  }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.05em" }}>{m.label}</div>
                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.6, fontWeight: 500 }}>{m.desc}</div>
                  </div>
                  {isActive && (
                    <div style={{
                      fontSize: 9, fontWeight: 900, background: m.activeBg,
                      color: m.activeColor, padding: "2px 10px", borderRadius: 99,
                      border: `1px solid ${m.activeBorder}`, textTransform: "uppercase", letterSpacing: "0.2em"
                    }}>
                      ● Active
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(0,242,255,0.03)",
        border: "1px solid rgba(0,242,255,0.10)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <Activity size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500, lineHeight: 1.6 }}>
          Configuration changes are applied to the WAF engine in real-time. Prevention Mode is recommended for production deployments.
        </p>
      </div>
    </div>
  );
}