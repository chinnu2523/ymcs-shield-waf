import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ShieldCheck, Zap, Activity, Terminal, Brain, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE from "../config";

// Simple markdown-to-JSX for bold and bullets
function renderMarkdown(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    const boldParsed = line.split(/\*\*(.+?)\*\*/g).map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
    );
    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return <div key={i} className="flex gap-2 mt-1"><span className="text-primary mt-0.5">•</span><span>{boldParsed}</span></div>;
    }
    // Empty line
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <div key={i}>{boldParsed}</div>;
  });
}

export default function AIAnalyst({ threats, counters }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "**Neural Interface Established.**\n\nI am the YMCS Shield AI Analyst. I have full visibility into your WAF telemetry and security logs.\n\nHow can I assist with your security perimeter today?", time: new Date().toLocaleTimeString().slice(0, 5) }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: "user", content: input, time: new Date().toLocaleTimeString().slice(0, 5) };
    setMessages(prev => [...prev, userMsg]);
    const sentMessage = input;
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sentMessage })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const aiMsg = {
        role: "assistant",
        content: data.response || "Analysis complete. No further insights available.",
        time: new Date().toLocaleTimeString().slice(0, 5)
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(`Connection error: ${err.message}`);
      const errMsg = {
        role: "assistant",
        content: `**Connection Error.**\n\nUnable to reach the AI backend: ${err.message}\n\nEnsure the backend is running at port 4000.`,
        time: new Date().toLocaleTimeString().slice(0, 5)
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Summarize system health status",
    "Analyze recent threat vectors",
    "Explain SQL injection detections",
    "Check rate limiting status",
    "What is the current anomaly level?"
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up stagger-1" style={{ height: "calc(100vh - 180px)" }}>
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-2 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase" style={{ letterSpacing: "0.03em" }}>
            <div className="p-2" style={{ background: "rgba(189,0,255,0.08)", borderRadius: 14, border: "1px solid rgba(189,0,255,0.2)", boxShadow: "0 4px 20px rgba(189,0,255,0.06)" }}>
              <Brain className="text-secondary" size={24} />
            </div>
            AI Guard Analyst
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--secondary)", boxShadow: "0 0 8px var(--secondary)", display: "inline-block" }} className="animate-pulse" />
            Neural Language Interface • Live Backend Connected
          </p>
        </div>
        
        <div style={{ padding: "10px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Sparkles size={14} className="text-secondary" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Mode: <span className="text-white">COGNITIVE ANALYSIS</span>
          </span>
        </div>
      </div>

      {/* ── Chat Container ── */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left: Chat History */}
        <div className="flex-1 glass-card p-0 flex flex-col overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar bg-black/20"
          >
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    m.role === "assistant" 
                    ? "bg-secondary/10 border-secondary/30 text-secondary" 
                    : "bg-primary/10 border-primary/30 text-primary"
                  }`}>
                    {m.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>

                  <div className={`flex flex-col gap-2 max-w-[80%] ${m.role === "user" ? "items-end" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">{m.role === "assistant" ? "SHIELD ANALYST" : "SECURE USER"}</span>
                      <span className="text-[10px] font-mono font-bold text-dim opacity-40">{m.time}</span>
                    </div>
                    <div className={`p-5 rounded-2xl text-[13px] leading-relaxed relative ${
                      m.role === "assistant" 
                      ? "bg-white/5 text-white border border-white/5 border-l-secondary border-l-2 shadow-[4px_4px_24px_rgba(0,0,0,0.5)]" 
                      : "bg-primary/10 text-primary border border-primary/20 shadow-[0_4px_16px_rgba(0,242,255,0.05)]"
                    }`}>
                      {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary flex items-center justify-center">
                  <Bot size={20} className="animate-pulse" />
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex gap-2 items-center border border-white/5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span className="text-[10px] font-mono text-dim ml-2">Analyzing telemetry data...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-6 border-t border-white/5 bg-black/40 shrink-0">
            {error && (
              <div className="mb-3 px-4 py-2 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-[10px] font-mono text-danger">{error}</p>
              </div>
            )}
            <div className="flex gap-4 p-2 pl-6 bg-white/5 border border-white/10 rounded-2xl items-center focus-within:border-secondary/40 transition-all">
              <Terminal size={16} className="text-dim opacity-40 shrink-0" />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask the Analyst about system health, threats, or security rules..."
                className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder:text-dim/40 text-sm py-3"
                disabled={isTyping}
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="w-12 h-12 rounded-xl bg-secondary hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-black shadow-[0_0_20px_var(--secondary-glow)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col gap-6 shrink-0">
          {/* Quick Suggestions */}
          <div className="glass-card p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={16} className="text-secondary" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Context Suggestions</h4>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(s)}
                  className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl text-left hover:bg-white/7 hover:border-secondary/30 transition-all group"
                >
                  <span className="text-[11px] font-bold text-dim group-hover:text-white transition-colors">{s}</span>
                  <ChevronRight size={12} className="text-dim group-hover:text-secondary shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Live System Metrics */}
          <div className="glass-card p-6 bg-secondary/5 border-secondary/20 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={16} className="text-secondary" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Live System Context</h4>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Total Requests",      value: counters?.total   ?? 0,                     color: "var(--primary)",   unit: "REQ" },
                { label: "Blocked Attacks",     value: counters?.blocked ?? 0,                     color: "var(--danger)",    unit: "BLK" },
                { label: "Block Rate",          value: `${counters?.blockRate ?? "0.0"}%`,          color: "var(--warning)",   unit: "" },
                { label: "Mean Latency",        value: `${counters?.latency  ?? 0}ms`,              color: "var(--success)",   unit: "" },
                { label: "Active Threats",      value: threats?.length ?? 0,                       color: "var(--secondary)", unit: "LIVE" },
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">{metric.label}</span>
                  <span className="text-sm font-black font-mono" style={{ color: metric.color }}>
                    {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                    {metric.unit && <span className="text-[8px] ml-1 opacity-60">{metric.unit}</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6 opacity-30 text-center">
              <p className="text-[9px] font-black text-dim uppercase tracking-[0.2em]">STABLE-X8 // V2.0.4</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
