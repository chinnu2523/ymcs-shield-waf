import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ShieldCheck, Zap, Activity, Terminal, Brain, ChevronRight, MessageSquare } from "lucide-react";

export default function AIAnalyst({ threats, counters }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Neural Interface established. I am the Quantum Guard AI. How can I assist with your security perimeter today?", time: "15:42" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input, time: new Date().toLocaleTimeString().slice(0, 5) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with real data awareness
    setTimeout(() => {
      let response = "Analyzing data stream... Our heuristics suggest the current load is stable.";
      
      if (input.toLowerCase().includes("status")) {
        response = `System Status Report: Total Ingress at ${counters?.total || 0} packets. Current Neural Engine load is 14%. Mitigation efficiency is at 99.8%.`;
      } else if (input.toLowerCase().includes("threat") || input.toLowerCase().includes("attack")) {
        const threatCount = threats?.length || 0;
        response = `I have logged ${threatCount} high-severity threat vectors in the active buffer. Most recent attempts originate from ${threats?.[0]?.ip || "unknown nodes"}. Recommending dynamic rate limiting.`;
      } else if (input.toLowerCase().includes("rule")) {
        response = "Security Policy Manager is optimal. I suggest reviewing the SQL Injection filter as it accounts for 45% of blocked traffic today.";
      }
      
      const aiMsg = { role: "assistant", content: response, time: new Date().toLocaleTimeString().slice(0, 5) };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestions = [
    "Summarize system health",
    "Analyze recent threat vectors",
    "Check mitigation efficiency",
    "Audit active security rules"
  ];

  return (
    <div className="flex flex-col h-full gap-8 animate-slide-up stagger-1 overflow-hidden">
      
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
              <Brain className="text-secondary" size={24} />
            </div>
            AI Guard Analyst
          </h1>
          <p className="text-dim mt-4 font-black uppercase flex items-center gap-2 opacity-60" style={{ fontSize: 10, letterSpacing: "0.3em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--secondary)", boxShadow: "0 0 8px var(--secondary)", display: "inline-block" }} className="animate-pulse" />
            Neural Language Interface • Core v2.0
          </p>
        </div>
        
        <div style={{
          padding: "10px 18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <Sparkles size={14} className="text-secondary" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Mode: <span className="text-white">COGNITIVE ANALYSIS</span></span>
        </div>
      </div>

      {/* ── Chat Container ── */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Chat History */}
        <div className="flex-1 glass-card p-0 flex flex-col overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar bg-black/20"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-5 animate-slide-up ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  m.role === "assistant" 
                  ? "bg-secondary/10 border-secondary/30 text-secondary" 
                  : "bg-primary/10 border-primary/30 text-primary"
                }`}>
                  {m.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                </div>

                <div className={`flex flex-col gap-2 max-w-[80%] ${m.role === "user" ? "items-end" : ""}`}>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">{m.role === "assistant" ? "QUANTUM ANALYST" : "SECURE USER"}</span>
                      <span className="text-[10px] font-mono font-bold text-dim opacity-40">{m.time}</span>
                   </div>
                   <div className={`p-5 rounded-2xl text-[13px] leading-relaxed relative ${
                     m.role === "assistant" 
                     ? "bg-white/5 text-white border border-white/5 border-l-secondary border-l-2 shadow-[4px_4px_24px_rgba(0,0,0,0.5)]" 
                     : "bg-primary/10 text-primary border border-primary/20 shadow-[0_4px_16px_rgba(0,242,255,0.05)]"
                   }`}>
                      {m.content}
                   </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-5 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary flex items-center justify-center">
                   <Bot size={20} className="animate-pulse" />
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex gap-1 items-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0s" }} />
                   <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0.2s" }} />
                   <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-black/40">
             <div className="flex gap-4 p-2 pl-6 bg-white/5 border border-white/10 rounded-2xl items-center focus-within:border-secondary/40 transition-all shadow-[inner_0_2px_8px_rgba(0,0,0,0.5)]">
                <Terminal size={16} className="text-dim opacity-40" />
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask the Analyst about system health or threat patterns..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder:text-dim/40 text-sm py-3"
                />
                <button 
                  onClick={handleSend}
                  className="w-12 h-12 rounded-xl bg-secondary hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-black shadow-[0_0_20px_var(--secondary-glow)]"
                >
                   <Send size={18} />
                </button>
             </div>
          </div>
        </div>

        <div className="w-80 flex flex-col gap-6">
           {/* Intelligence Suggestions */}
           <div className="glass-card p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                 <Activity size={16} className="text-secondary" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Context Suggestions</h4>
              </div>
              <div className="flex flex-col gap-3">
                 {suggestions.map((s, i) => (
                   <button 
                    key={i} 
                    onClick={() => { setInput(s); }}
                    className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl text-left hover:bg-white/7 hover:border-secondary/30 transition-all group"
                   >
                     <span className="text-[11px] font-bold text-dim group-hover:text-white transition-colors">{s}</span>
                     <ChevronRight size={14} className="text-dim group-hover:text-secondary" />
                   </button>
                 ))}
              </div>
           </div>

           {/* Model Status Card */}
           <div className="glass-card p-6 bg-secondary/5 border-secondary/20 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck size={16} className="text-secondary" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Intelligence Metrics</h4>
              </div>
              <div className="flex flex-col gap-5">
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest">Active Threats</span>
                       <span className="text-[9px] font-mono font-bold text-secondary">{threats?.length || 0}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-secondary-glow" style={{ width: "60%" }} />
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-dim uppercase tracking-widest">Neural Load</span>
                       <span className="text-[9px] font-mono font-bold text-secondary">14%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-secondary" style={{ width: "14%" }} />
                    </div>
                 </div>
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
