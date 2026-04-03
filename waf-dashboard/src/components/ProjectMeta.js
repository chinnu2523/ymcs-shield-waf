import React from "react";

export default function ProjectMeta() {
  const metadata = [
    { label: "Student Lead",    value: "K. Meghana",                                   icon: "👥" },
    { label: "Student Lead",    value: "R. Yamini",                                    icon: "👥" },
    { label: "Student Lead",    value: "G. Charan",                                    icon: "👥" },
    { label: "Student Name",    value: "VISAKA VEERA GURU DATTA SRINIDHI",             icon: "👤" },
    { label: "Institution",     value: "KL UNIVERSITY",                                icon: "🏛️" },
    { label: "Project Title",   value: "YMCS Shield WAF Security Suite",               icon: "🛡️" },
    { label: "Academic Session",value: "2022-2026 Batch",                              icon: "🎓" },
    { label: "Submission Ref",  value: "KL-CSE-MAJOR-2026-088",                        icon: "📄" },
    { label: "Tech Stack",      value: "React, Node.js, AI Core, YMCS CSS",            icon: "💻" }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-12">
        <div className="academic-card">
            <h2 className="text-3xl font-black gradient-text uppercase tracking-tighter">Academic Metadata</h2>
            <p className="text-xs text-dim font-bold uppercase tracking-[0.3em] opacity-40 mt-1">Official Project Documentation Module</p>
        </div>
        <div className="hidden md:block text-right">
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Platform Version</div>
            <div className="text-xl font-bold">1.4.0-STABLE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metadata.map((item, idx) => (
          <div key={idx} className="glass-panel p-8 hover-tilt group">
            <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                    {item.icon}
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-2 opacity-50">{item.label}</h4>
                    <p className="text-lg font-bold text-white group-hover:text-primary transition-colors">{item.value}</p>
                </div>
            </div>
            {/* Decorative bar */}
            <div className="w-full h-[1px] bg-white/5 mt-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/40 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Abstract Section */}
      <div className="glass-panel p-10 mt-12 bg-gradient-to-br from-bg-panel to-primary/5">
        <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-6">Executive Summary</h3>
        <p className="text-dim leading-relaxed font-medium">
            YMCS Shield is an innovative Web Application Firewall designed to address modern cyber threats through 
            neural-pattern recognition and real-time visualization. Developed at <span className="text-white font-bold">KL UNIVERSITY</span> as a 
            culminating Major Project, this platform bridges the gap between complex security data and intuitive operational intelligence. 
            The system employs a decentralized Shadow DOM architecture for host-environment isolation, ensuring peak 
            reliability in adversarial conditions.
        </p>
        <div className="mt-10 flex gap-4">
            <div className="px-4 py-2 bg-white/5 rounded-md border border-white/10 text-[9px] font-bold uppercase tracking-widest text-dim">
                Verified: KL-COE
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-md border border-white/10 text-[9px] font-bold uppercase tracking-widest text-dim">
                Status: Academic Submission Ready
            </div>
        </div>
      </div>
    </div>
  );
}
