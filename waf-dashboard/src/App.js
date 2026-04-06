import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSimulator from "./hooks/useSimulator";
import Sidebar        from "./components/sidebar";
import Dashboard      from "./components/Dashboard";
import Threats        from "./components/Threats";
import Analytics      from "./components/Analytics";
import RulesPage      from "./components/RulesPage";
import SettingsPage   from "./components/SettingsPage";
import AIAnalyst      from "./components/AIAnalyst";
import Reporting      from "./components/Reporting";
import LiveLog        from "./components/LiveLog";
import BlocklistManager from "./components/BlocklistManager";
import CyberBackground from "./components/CyberBackground";
import LandingPage    from "./components/LandingPage";
import Login from "./components/Login";
import UsersManagement from "./components/UsersManagement";
import ProjectMeta    from "./components/ProjectMeta";
import UserDashboard  from "./components/UserDashboard";
import PredictionPanel from "./components/PredictionPanel";


const VIEW_STATES = {
  LANDING: "LANDING",
  LOGIN: "LOGIN",
  BOOT: "BOOT",
  APP: "APP"
};

export default function App() {
  const [viewState, setViewState] = useState(VIEW_STATES.LANDING);
  const [activeView, setActiveView] = useState("dashboard"); // Sidebar uses lowercase IDs
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("waf_theme") || "dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("waf_theme", newTheme);
  };

  const onLogout = React.useCallback(() => {
    setViewState(VIEW_STATES.LOGIN);
    setRunning(false);
  }, []);

  const {
    running, setRunning, status,
    threats, setThreats,
    logs, counters, history,
    rules, setRules,
  } = useSimulator(onLogout);

  // Handle Boot Sequence Delay
  useEffect(() => {
    if (viewState === VIEW_STATES.BOOT) {
      const timer = setTimeout(() => {
        setViewState(VIEW_STATES.APP);
        setRunning(true); // Auto-start the engine after boot for "wow" factor
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [viewState, setRunning]);

  const renderBootSequence = () => (
    <div className="view-container bg-bg-dark flex flex-col items-center justify-center font-mono overflow-hidden">
      <div className="cyber-grid absolute inset-0 pointer-events-none" style={{ opacity: 0.12, zIndex: 0 }} />
      <div className="relative z-10 flex flex-col items-center animate-hologram" style={{ textAlign: "center" }}>
        
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "rgba(0,242,255,0.08)",
            border: "1px solid rgba(0,242,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
            </svg>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.35em", color: "#fff", textTransform: "uppercase" }}>YMCS</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", color: "var(--text-dim)", textTransform: "uppercase" }}>Shield Suite</div>
          </div>
        </div>

        <div className="text-primary font-black glitch-text uppercase" style={{ fontSize: 13, letterSpacing: "0.45em", marginBottom: "1.5rem" }}>
          Initializing YMCS Shield Core
        </div>

        <div style={{
          width: 320, height: 3,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 99,
          overflow: "hidden",
          border: "1px solid rgba(0,242,255,0.08)",
          boxShadow: "0 0 16px rgba(0,242,255,0.06)",
          marginBottom: "2.5rem"
        }}>
          <div
            className="animate-progress"
            style={{ height: "100%", background: "var(--primary)", boxShadow: "0 0 10px var(--primary)", borderRadius: 99 }}
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem 3rem",
          opacity: 0.65,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: "0.1em"
        }}>
          {[
            ["Shield Core",     "[DEPLOYED]"],
            ["Neural Guardian",  "[READY]"],
            ["Security Layer",  "[ACTIVE]"],
            ["Geo-IP Database", "[SYNCED]"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", width: 210 }}>
              <span style={{ color: "var(--text-dim)" }}>{label}</span>
              <span style={{ color: "var(--success)" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        <div className="animate-scanline" style={{ width: "100%", height: 2, background: "linear-gradient(90deg, transparent, var(--primary), transparent)", opacity: 0.25 }} />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-bg-dark font-sans text-text-main overflow-hidden ${theme === 'light' ? 'light-mode' : ''}`}>
      
      {/* ── View Orchestrator ── */}
      {viewState === VIEW_STATES.LANDING && (
        <LandingPage onEnter={() => setViewState(VIEW_STATES.LOGIN)} />
      )}

      {viewState === VIEW_STATES.LOGIN && (
        <Login 
          onSuccess={(user) => {
            setCurrentUser(user);
            setViewState(VIEW_STATES.BOOT);
          }} 
          onBack={() => setViewState(VIEW_STATES.LANDING)} 
        />
      )}

      {viewState === VIEW_STATES.BOOT && renderBootSequence()}

      {viewState === VIEW_STATES.APP && (
        <CyberBackground>
          <div className="view-container">
            <Sidebar 
              activeView={activeView} 
              setActiveView={setActiveView} 
              currentUser={currentUser} 
              theme={theme} 
              toggleTheme={toggleTheme} 
            />

            <main className="flex-1 p-10 overflow-y-auto custom-scrollbar relative">
              
              {/* Cinematic Page Header (Dynamic) */}
              <div className="mb-10 animate-slide-up flex flex-col gap-2">
                 <div style={{ display: "inline-flex", padding: "4px 12px", background: "rgba(0,242,255,0.06)", borderRadius: 6, border: "1px solid rgba(0,242,255,0.15)", width: "fit-content" }}>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Neural Interface Terminal v2.0.4</span>
                 </div>
              </div>

              {/* View Router */}
              <div className="relative z-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {activeView === "dashboard"     && <Dashboard rules={rules} counters={counters} history={history} threats={threats} logs={logs} status={status} />}
                    {activeView === "threats"        && <Threats threats={threats} setThreats={setThreats} setActiveView={setActiveView} />}
                    {activeView === "analytics"      && <Analytics counters={counters} history={history} threats={threats} />}
                    {activeView === "userdashboard"  && <UserDashboard />}
                    {activeView === "predictions"    && <PredictionPanel />}
                    {activeView === "rules"          && <RulesPage rules={rules} setRules={setRules} />}
                    {activeView === "ai"             && <AIAnalyst threats={threats} counters={counters} />}
                    {activeView === "reporting"      && <Reporting />}
                    {activeView === "livelog"        && <LiveLog logs={logs} />}
                    {activeView === "blocklist"      && <BlocklistManager />}
                    {activeView === "users"          && <UsersManagement currentUser={currentUser} />}
                    {activeView === "settings"       && <SettingsPage />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Overlay HUD Decoration */}
              <div className="fixed bottom-10 right-10 pointer-events-none opacity-20">
                 <ProjectMeta />
              </div>
            </main>
          </div>
        </CyberBackground>
      )}
    </div>
  );
}