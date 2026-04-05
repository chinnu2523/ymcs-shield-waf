import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API_BASE, { BACKEND_BASE } from "../config";

export default function useSimulator(onLogout) {
  const [running, setRunning]   = useState(false);
  const [status, setStatus]     = useState("loading"); // online, offline, loading
  const [threats, setThreats]   = useState([]);
  const [logs, setLogs]         = useState([]);
  const [counters, setCounters] = useState({ total: 0, blocked: 0, allowed: 0, latency: 0, blockRate: "0.0" });
  const [history, setHistory]   = useState({
    allowed: Array(20).fill(0),
    blocked: Array(20).fill(0),
  });
  const [rules, setRules] = useState([]);

  const socketRef = useRef(null);

  const fetchInitialSnapshot = async () => {
    try {
      const token = localStorage.getItem("waf_jwt_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      // ── Initial Stats & History ──
      const sRes = await fetch(`${API_BASE}/stats`, { headers });
      if (sRes.status === 401) {
        localStorage.removeItem("waf_jwt_token");
        if (onLogout) onLogout();  // was: window.location.reload()
        return;
      }
      const sData = await sRes.json();
      setCounters(prev => ({ ...prev, ...sData }));

      const hRes = await fetch(`${API_BASE}/history`, { headers });
      const hData = await hRes.json();
      const allowedHistory = hData.map(h => h.allowed);
      const blockedHistory = hData.map(h => h.blocked);
      while (allowedHistory.length < 20) allowedHistory.unshift(0);
      while (blockedHistory.length < 20) blockedHistory.unshift(0);
      setHistory({ allowed: allowedHistory, blocked: blockedHistory });

      // ── Initial Logs & Rules ──
      const [lRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/logs`, { headers }),
        fetch(`${API_BASE}/rules`, { headers })
      ]);

      if (lRes.ok) {
        const lData = await lRes.json();
        setLogs(lData.slice(0, 50));
        syncThreatsFromLogs(lData);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRules(rData);
      }

      setStatus("online");
    } catch (e) {
      console.warn("Initial snapshot failed:", e.message);
      setStatus("offline");
    }
  };

  const syncThreatsFromLogs = (logs) => {
    const realThreats = logs.filter(l => l.status === "BLOCKED").map(l => ({
      id: l._id || l.id,
      time: new Date(l.timestamp || Date.now()).toLocaleTimeString(),
      type: l.attackType || "Signature Match",
      severity: l.riskScore > 80 ? "critical" : "high",
      path: l.path,
      ip: l.ip || "127.0.0.1",
      country: l.country || "Unknown"
    }));
    setThreats(realThreats.slice(0, 15));
  };

  useEffect(() => {
    if (!running) return;

    // ── 1. Fetch persistent state snapshot ──
    fetchInitialSnapshot();

    // ── 2. Initialize Real-Time Socket ──
    const token = localStorage.getItem("waf_jwt_token");
    const socket = io(BACKEND_BASE, {
      auth: { token },
      reconnectionAttempts: 10,
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Real-Time HUD Connected");
      setStatus("online");
    });

    socket.on("stats_update", (data) => {
      setCounters(prev => ({ ...prev, ...data }));
    });

    socket.on("new_log", (log) => {
      // Prepend to logs
      setLogs(prev => [log, ...prev].slice(0, 50));
      
      // If it's a blocked threat, add to threats
      if (log.status === "BLOCKED") {
        const newThreat = {
          id: log.id,
          time: new Date(log.timestamp).toLocaleTimeString(),
          type: log.attackType,
          severity: log.riskScore > 80 ? "critical" : "high",
          path: log.path,
          ip: log.ip,
          country: log.country
        };
        setThreats(prev => [newThreat, ...prev].slice(0, 15));
      }
    });

    socket.on("rule_update", (newRules) => {
      setRules(newRules);
    });

    socket.on("history_update", (newHistory) => {
      setHistory(newHistory);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setStatus("offline");
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [running, onLogout]);

  return { running, setRunning, status, threats, setThreats, logs, counters, history, rules, setRules };
}