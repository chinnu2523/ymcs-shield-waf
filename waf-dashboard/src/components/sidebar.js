import React from "react";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  BarChart3, 
  FileText, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  Activity,
  Terminal,
  Cpu,
  Users,
  Brain,
  Sun,
  Moon
} from "lucide-react";

export default function Sidebar({ activeView, setActiveView, currentUser = {}, theme, toggleTheme }) {
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const menuItems = [
    { id: "dashboard",      icon: <LayoutDashboard size={18} />, label: "Dashboard",       badge: null,   section: "main" },
    { id: "threats",        icon: <ShieldAlert size={18} />,     label: "Threats",         badge: "LIVE", section: "main" },
    { id: "analytics",      icon: <BarChart3 size={18} />,       label: "Analytics",       badge: null,   section: "main" },
    { id: "userdashboard",  icon: <Users size={18} />,           label: "User Intel",      badge: "NEW",  section: "main" },
    { id: "predictions",    icon: <Brain size={18} />,           label: "AI Predictions",  badge: "AI",   section: "main" },
    { id: "rules",          icon: <ShieldCheck size={18} />,     label: "Security Rules",  badge: null,   section: "tools" },
    { id: "blocklist",      icon: <ShieldAlert size={18} />,     label: "Blocklist",       badge: "CTRL", section: "tools" },
    { id: "ai",             icon: <MessageSquare size={18} />,   label: "AI Analyst",      badge: "BETA", section: "tools" },
    { id: "reporting",      icon: <FileText size={18} />,        label: "Reporting",       badge: null,   section: "tools" },
    { id: "users",          icon: <Users size={18} />,           label: "Users Admin",     badge: "SEC",  section: "tools", adminOnly: true },
    { id: "livelog",        icon: <Terminal size={18} />,        label: "Forensic Logs",   badge: "LIVE", section: "tools" },
    { id: "settings",       icon: <Settings size={18} />,        label: "Settings",        badge: null,   section: "tools" },
  ];

  const mainItems = menuItems.filter(i => i.section === "main" && (!i.adminOnly || isAdmin));
  const toolItems = menuItems.filter(i => i.section === "tools" && (!i.adminOnly || isAdmin));

  const NavItem = ({ item }) => {
    const isActive = activeView === item.id;
    const badgeColors = {
      "LIVE": "text-success border-success/30 bg-success/10",
      "NEW":  "text-primary border-primary/30 bg-primary/10",
      "AI":   "text-secondary border-secondary/30 bg-secondary/10",
      "BETA": "text-warning border-warning/30 bg-warning/10",
      "SEC":  "text-danger border-danger/30 bg-danger/10",
    };
    return (
      <button
        key={item.id}
        onClick={() => setActiveView(item.id)}
        className={`group flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
          isActive 
          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(0,242,255,0.05)]" 
          : "text-dim hover:bg-white/5 hover:text-white border border-transparent"
        }`}
      >
        {/* Active bar */}
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary-glow)]" />}

        <div className="flex items-center gap-4 relative z-10">
          <div className={`${isActive ? "text-primary" : "text-dim group-hover:text-white"} transition-colors`}>
            {item.icon}
          </div>
          <span className={`text-[12px] font-bold uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
            {item.label}
          </span>
        </div>

        {item.badge && (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
            isActive ? "bg-primary/20 border-primary/30 text-primary" : (badgeColors[item.badge] || "bg-white/5 border-white/10 text-dim")
          }`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-72 h-screen flex flex-col glass-panel border-r border-white/5 relative z-50">
      
      {/* ── Sidebar Branding ── */}
      <div className="p-8 mb-2">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveView("dashboard")}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-primary/50 shadow-[0_0_15px_rgba(0,242,255,0.15)]">
              <ShieldCheck className="text-primary" size={22} />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-[#05070a] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black uppercase tracking-[0.2em] text-sm leading-none mb-1">YMCS</span>
            <span className="text-primary font-bold text-[9px] uppercase tracking-[0.3em] opacity-80">Shield Suite</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Menu ── */}
      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <div className="mb-3 ml-4">
          <span className="text-[10px] font-black text-dim uppercase tracking-[0.25em] opacity-40">Main System</span>
        </div>
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}

        <div className="my-3 ml-4">
          <span className="text-[10px] font-black text-dim uppercase tracking-[0.25em] opacity-40">Tools</span>
        </div>
        {toolItems.map(item => <NavItem key={item.id} item={item} />)}

        {/* ── Neural Spectrum Toggle ── */}
        <div className="mt-4 px-2">
          <button
            onClick={toggleTheme}
            className="group flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300 relative overflow-hidden bg-white/5 border border-white/10 text-dim hover:text-primary hover:border-primary/20 hover:bg-primary/5"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="transition-colors group-hover:text-primary">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100">
               <div className={`w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-dim" : "bg-primary animate-pulse"}`} />
               <div className={`w-1.5 h-1.5 rounded-full ${theme === "light" ? "bg-dim" : "bg-primary animate-pulse"}`} />
            </div>
          </button>
        </div>

        {/* ── Sign Out Button ── */}
        <div className="mt-4 mb-4 px-2">
          <button
            onClick={() => {
              localStorage.removeItem("waf_jwt_token");
              window.location.reload();
            }}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,0,51,0.1)] group"
          >
            <ShieldAlert size={16} className="group-hover:animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sign Out / Lock</span>
          </button>
        </div>
      </nav>

      {/* ── Sidebar Footer ── */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-success" />
              <span className="text-[9px] font-black text-dim uppercase tracking-widest">Network Persistence</span>
            </div>
            <span className="text-[9px] font-mono text-success font-bold">1.4ms</span>
          </div>
          
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-success/40 animate-pulse w-3/4" />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Cpu size={14} className="text-dim" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Kernel-6</span>
                <span className="text-[8px] font-bold text-dim uppercase opacity-50">STABLE-X8</span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
          </div>
        </div>
      </div>

    </aside>
  );
}