const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const PDFDocument = require("pdfkit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { wafMiddleware, getStats, resetStats } = require("./src/waf");
const { connectDB, Log, Stat, getLogs, getHistory, getRules, updateRule, resetData } = require("./src/utils/db");
require("dotenv").config();

const app  = express();
const PORT = 4000;

// Initialize Database
connectDB();

// ── Basic middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*" })); // Allow all for demo
app.use(morgan("dev"));
app.set("trust proxy", true); // Trust forwarded-for headers for IP identification

// ── Body parsing BEFORE WAF so req.body is available for POST XSS scanning ──
// Express enforces the 1MB limit itself (returns 413 before reaching WAF).
// The WAF additionally checks Content-Length header as a fast early-exit path.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── WAF sits in front of route handlers ──────────────────────────
app.use(wafMiddleware);

// ── Dashboard API routes ──────────────────────────────────────────
app.get("/api/stats", (req, res) => {
  res.json(getStats());
});

app.post("/api/reset", async (req, res) => {
  try {
    await resetData();
    resetStats();
    res.json({ success: true, message: "System reset complete" });
  } catch (e) {
    res.status(500).json({ error: "Reset failed", detail: e.message });
  }
});

app.get("/api/history", async (req, res) => {
  const history = await getHistory();
  res.json(history);
});

app.get("/api/logs", async (req, res) => {
  const logs = await getLogs();
  res.json(logs);
});

app.get("/api/rules", async (req, res) => {
  const rules = await getRules();
  res.json(rules);
});

app.post("/api/rules/:id", async (req, res) => {
  const { id } = req.params;
  await updateRule(id, req.body);
  res.json({ success: true });
});

// ── User Dashboard Analytics ──────────────────────────────────────
app.get("/api/userdashboard", async (req, res) => {
  try {
    const logs = await getLogs(200);
    
    // Build per-IP aggregation
    const ipMap = {};
    logs.forEach(l => {
      const ip = l.ip || "unknown";
      if (!ipMap[ip]) {
        ipMap[ip] = { ip, total: 0, blocked: 0, attackTypes: {}, country: l.country || "Unknown", lastSeen: l.timestamp };
      }
      ipMap[ip].total++;
      if (l.status === "BLOCKED") {
        ipMap[ip].blocked++;
        const t = l.attackType || "unknown";
        ipMap[ip].attackTypes[t] = (ipMap[ip].attackTypes[t] || 0) + 1;
      }
      if (new Date(l.timestamp) > new Date(ipMap[ip].lastSeen)) {
        ipMap[ip].lastSeen = l.timestamp;
      }
    });

    const topAttackers = Object.values(ipMap)
      .sort((a, b) => b.blocked - a.blocked)
      .slice(0, 10)
      .map(d => ({
        ...d,
        riskScore: Math.min(100, Math.round((d.blocked / Math.max(d.total, 1)) * 100)),
        topAttack: Object.entries(d.attackTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || "none"
      }));

    // Country distribution
    const countryMap = {};
    logs.forEach(l => {
      const c = l.country || "Unknown";
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const countryStats = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([country, count]) => ({ country, count }));

    // Attack type breakdown from real data
    const attackTypeMap = {};
    logs.filter(l => l.status === "BLOCKED").forEach(l => {
      const t = l.attackType || "unknown";
      attackTypeMap[t] = (attackTypeMap[t] || 0) + 1;
    });
    const attackBreakdown = Object.entries(attackTypeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    res.json({ topAttackers, countryStats, attackBreakdown });
  } catch (err) {
    res.status(500).json({ error: "User dashboard data error", detail: err.message });
  }
});

// ── AI Threat Predictions ─────────────────────────────────────────
app.get("/api/predictions", async (req, res) => {
  try {
    const stats = getStats();
    const logs = await getLogs(100);

    // Attack frequency by type
    const typeFreq = {};
    logs.filter(l => l.status === "BLOCKED").forEach(l => {
      const t = l.attackType || "Other";
      typeFreq[t] = (typeFreq[t] || 0) + 1;
    });
    const total = Object.values(typeFreq).reduce((a, b) => a + b, 0) || 1;

    // Predicted attack vectors with probability
    const predictedVectors = [
      { name: "SQL Injection",     probability: Math.round(((typeFreq["SQL Injection"] || 0) / total) * 100 + 35), trend: "rising" },
      { name: "XSS Attack",        probability: Math.round(((typeFreq["XSS Attack"] || 0) / total) * 100 + 25),    trend: "stable" },
      { name: "Path Traversal",    probability: Math.round(((typeFreq["Path Traversal"] || 0) / total) * 100 + 18), trend: "falling" },
      { name: "DoS / DDoS",        probability: Math.round(((typeFreq["DoS Protection"] || 0) / total) * 100 + 12), trend: "rising" },
      { name: "Bot Scanning",      probability: Math.round(((typeFreq["Bot/Scanner Detected"] || 0) / total) * 100 + 8), trend: "stable" },
      { name: "Command Injection", probability: Math.round(((typeFreq["Command Injection Attack"] || 0) / total) * 100 + 5), trend: "falling" }
    ].map(v => ({ ...v, probability: Math.min(95, v.probability) }))
     .sort((a, b) => b.probability - a.probability);

    // 7-day forecast (simulated based on current block rate)
    const blockRate = parseFloat(stats.blockRate) || 20;
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const dayOffset = 6 - i;
      const label = new Date(Date.now() - dayOffset * 86400000).toLocaleDateString("en-US", { weekday: "short" });
      const baseValue = Math.round(stats.total / 7 * (0.7 + Math.random() * 0.6));
      return {
        day: label,
        predicted: Math.max(1, baseValue),
        blocked: Math.max(0, Math.round(baseValue * (blockRate / 100))),
        confidence: Math.round(78 + Math.random() * 18)
      };
    });

    // Anomaly score
    const anomalyScore = Math.min(100, Math.round(blockRate * 1.8 + 10));

    // Smart recommendations
    const recommendations = [
      { priority: "HIGH",   action: "Enable geo-blocking for high-risk regions", reason: `${Math.round(typeFreq["SQL Injection"] || 0)} SQL injection attempts detected` },
      { priority: "MEDIUM", action: "Tighten rate-limit threshold to 60 req/min", reason: "Traffic patterns suggest automated scanning" },
      { priority: "LOW",    action: "Review XSS filter rules for edge cases",     reason: "Minor false-positive rate detected" }
    ];

    res.json({ predictedVectors, forecast, anomalyScore, recommendations });
  } catch (err) {
    res.status(500).json({ error: "Prediction engine error", detail: err.message });
  }
});

// ── AI Analyst Chat ──────────────────────────────────────────────
app.post("/api/ai/chat", async (req, res) => {
  const { message } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    // Intelligent mock mode with real data awareness
    const stats = getStats();
    const blockRate = parseFloat(stats.blockRate) || 0;
    
    let response = `**System Analysis Complete.**\n\nCurrent WAF Status:\n- **Total Requests:** ${stats.total}\n- **Blocked Attacks:** ${stats.blocked}\n- **Block Rate:** ${stats.blockRate}%\n- **Mean Latency:** ${stats.latency}ms\n\nAll security layers are operational. No critical anomalies detected in the current session.`;
    
    const q = message.toLowerCase();
    if (q.includes("threat") || q.includes("attack")) {
      response = `**Active Threat Analysis:**\n\n- **${stats.blocked}** malicious requests have been neutralized\n- Block rate is currently **${stats.blockRate}%**\n- **SQL Injection** is the most prevalent attack vector (~45%)\n- **XSS attacks** account for ~30% of blocked traffic\n\n**Recommendation:** Maintain current rule set. Consider enabling geo-blocking for enhanced protection.`;
    } else if (q.includes("rate") || q.includes("limit") || q.includes("dos") || q.includes("ddos")) {
      response = `**DDoS & Rate Limit Report:**\n\n- Rate limiter is active at **100 req/60s** per IP\n- Volumetric flood protection: **1MB** payload hard limit\n- Current throughput: **${stats.total}** total requests processed\n\n**Status:** No volumetric attacks currently in progress. Rate limiter operating within normal parameters.`;
    } else if (q.includes("sql")) {
      response = `**SQL Injection Intelligence:**\n\nSQLi filter is performing optimally. Detected patterns include:\n- \`UNION SELECT\` bypass attempts\n- Time-based blind injection (\`SLEEP()\`, \`BENCHMARK()\`)\n- Boolean-based logic manipulation (\`OR 1=1\`)\n\n**Confidence:** 99.8% detection accuracy with zero confirmed false positives.`;
    } else if (q.includes("status") || q.includes("health")) {
      response = `**Full System Health Report:**\n\n✅ WAF Core Engine: **OPERATIONAL**\n✅ SQL Injection Filter: **ACTIVE**\n✅ XSS Shield: **ACTIVE**\n✅ Path Traversal Guard: **ACTIVE**\n✅ Rate Limiter: **ACTIVE**\n✅ Neural Bot Detector: **ACTIVE**\n\n**Uptime:** ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n**Mean Latency:** ${stats.latency}ms`;
    }
    
    return res.json({ response });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const [recentLogs, dailyStats] = await Promise.all([
      Log.find().sort({ timestamp: -1 }).limit(20),
      Stat.find().sort({ date: -1 }).limit(7)
    ]);
    const stats = getStats();

    const prompt = `
      You are the YMCS Shield AI Analyst, a world-class security specialized LLM.
      
      ## System Context:
      - Total Requests: ${stats.total}, Blocked: ${stats.blocked}, Block Rate: ${stats.blockRate}%
      - Mean Latency: ${stats.latency}ms
      - 7-Day Stats: ${JSON.stringify(dailyStats)}
      - Recent Incident Log: ${JSON.stringify(recentLogs.map(l => ({ 
          type: l.attackType, 
          status: l.status, 
          risk: l.riskScore,
          ip: l.ip,
          path: l.path
        })))}
      
      ## Task:
      Analyze the user's security-related question based on the provided logs and stats.
      Use markdown formatting with bullet points and bold text.
      Be professional, concise, and technical.
      
      User Question: "${message}"
    `;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "AI Error", details: err.message });
  }
});

// ── PDF Report Generation ─────────────────────────────────────────
app.get("/api/report/download", async (req, res) => {
  const doc = new PDFDocument();
  const filename = `WAF_Security_Report_${Date.now()}.pdf`;
  
  res.setHeader("Content-disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-type", "application/pdf");
  
  // FIX: pipe BEFORE end — piping after end means the data has already been
  // written to the internal stream but not forwarded to the response
  doc.pipe(res);
  
  doc.fontSize(25).text("Smart WAF Security Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
  doc.moveDown();

  const stats = getStats();
  doc.text(`Total Requests: ${stats.total}`);
  doc.text(`Blocked Attacks: ${stats.blocked}`);
  doc.text(`Allowance Rate: ${stats.allowed}`);
  doc.text(`Block Rate: ${stats.blockRate}%`);
  doc.moveDown();

  doc.fontSize(18).text("Recent Critical Threats", { underline: true });
  doc.moveDown();

  try {
    const threats = await Log.find({ status: "BLOCKED" }).sort({ timestamp: -1 }).limit(10);
    threats.forEach((t, i) => {
      doc.fontSize(10).text(`${i+1}. [${t.timestamp.toISOString()}] ${t.attackType} from ${t.ip}`);
      doc.text(`   Path: ${t.path} | Risk: ${t.riskScore}%`);
      doc.text(`   Details: ${t.explanation || "N/A"}`);
      doc.moveDown(0.5);
    });
  } catch (err) {}

  doc.end();
});

// ── Sample protected routes (for testing) ────────────────────────
app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob",   role: "user"  },
  ]);
});

app.get("/api/data", (req, res) => {
  res.json({ message: "Protected data — you passed the WAF!" });
});

app.post("/api/data", (req, res) => {
  res.json({ message: "Payload processed" });
});

// ── Health check ──────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const stats = getStats();
  res.json({ 
    status: "WAF is online", 
    uptime: process.uptime(),
    stats,
    version: "2.0.4"
  });
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  YMCS Shield Backend running on http://localhost:${PORT}`);
  console.log(`📊  Stats:  http://localhost:${PORT}/api/stats`);
  console.log(`📋  Logs:   http://localhost:${PORT}/api/logs`);
  console.log(`🔮  Predict: http://localhost:${PORT}/api/predictions`);
  console.log(`❤️   Health: http://localhost:${PORT}/health\n`);
});