import { useState, useEffect, useRef } from "react";
import { rnd, rndIP, ts, ATTACK_POOL } from "../utils/helpers";

import API_BASE from "../config";

export default function useSimulator() {
  const [running, setRunning]   = useState(false);
  const [threats, setThreats]   = useState([]);
  const [logs, setLogs]         = useState([]);
  const [counters, setCounters] = useState({ total: 0, blocked: 0, allowed: 0, latency: 0 });
  const [history, setHistory]   = useState({
    allowed: Array(20).fill(0),
    blocked: Array(20).fill(0),
  });
  const [rules, setRules] = useState([]);

  const pollRef = useRef(null);

  const fetchRealData = async () => {
    try {
      const sRes = await fetch(`${API_BASE}/stats`);
      const sData = await sRes.json();
      setCounters(prev => ({ ...prev, ...sData }));

      const hRes = await fetch(`${API_BASE}/history`);
      const hData = await hRes.json();
      const allowedHistory = hData.map(h => h.allowed);
      const blockedHistory = hData.map(h => h.blocked);
      while (allowedHistory.length < 20) allowedHistory.unshift(0);
      while (blockedHistory.length < 20) blockedHistory.unshift(0);
      setHistory({ allowed: allowedHistory, blocked: blockedHistory });

      const lRes = await fetch(`${API_BASE}/logs`);
      if (lRes.ok) {
        const lData = await lRes.json();
        if (Array.isArray(lData)) {
          setLogs(lData.slice(0, 50));
          const realThreats = lData.filter(l => l.status === "BLOCKED").map(l => ({
            id: l._id,
            time: new Date(l.timestamp).toLocaleTimeString(),
            ip: l.ip,
            type: l.attackType,
            severity: l.riskScore > 80 ? "critical" : "high",
            payload: l.payload
          }));
          setThreats(realThreats);
        }
      }

      const rRes = await fetch(`${API_BASE}/rules`);
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData)) setRules(rData);
      }

    } catch (e) {
      console.warn("Backend sync error:", e.message);
    }
  };

  useEffect(() => {
    if (running) {
      // Fetch immediately then poll
      fetchRealData();
      pollRef.current = setInterval(() => {
        fetchRealData();
      }, 2000); // 2s poll for a balance of "live" and performance
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [running]);

  return { running, setRunning, threats, setThreats, logs, counters, history, rules, setRules };
}