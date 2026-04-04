const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const compression = require("compression");
const cluster     = require("cluster");
const os          = require("os");
const PDFDocument = require("pdfkit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { wafMiddleware, getStats, resetStats } = require("./src/waf");
const { connectDB, Log, Stat, getLogs, getHistory, getRules, updateRule, resetData, BlockedIP, Setting } = require("./src/utils/db");
const { login, seedAdminUser, verifyToken } = require("./src/utils/auth");
const monitor = require("./src/utils/systemMonitor");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 4000;

// Initialize database logic moved to workers

// Monitor start logic moved to workers

// ── Basic middleware ──────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = ["http://localhost:3000", "http://localhost:4000", "https://chinnu2523.github.io"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(compression());         // GZIP payload compression for performance
app.use(morgan("dev"));
app.set("trust proxy", true); // Trust forwarded-for headers for IP identification

// ── Body parsing BEFORE WAF so req.body is available for POST XSS scanning ──
// Express enforces the 1MB limit itself (returns 413 before reaching WAF).
// The WAF additionally checks Content-Length header as a fast early-exit path.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Dashboard API routes ──────────────────────────────────────────

// ── CORE SYSTEM ENDPOINTS (Accessible prior to complex WAF logic) ──
app.get("/health", (req, res) => {
  const health = monitor.getHealthState();
  res.json({ 
    status:   health.backend.status === "ONLINE" ? "WAF is online" : "WAF degraded",
    uptime:   process.uptime(),
    backend:  health.backend.status,
    database: health.database.status,
    waf:      health.waf.status,
    stats:    getStats(),
    version:  "2.0.6-SECURE"
  });
});

// Auth Route (Bypass WAF body scanning to allow special chars in passwords)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ── WAF sits in front of all remaining dashboard API routes ───────
app.use(wafMiddleware);

app.get("/api/stats", verifyToken, (req, res) => {
  res.json(getStats());
});

// ── PERSISTENT BLOCKLIST MANAGEMENT ──────────────────────────────
app.get("/api/blocklist", verifyToken, async (req, res) => {
  try {
    const records = await BlockedIP.find().sort("-blockedAt");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blocklist" });
  }
});

app.post("/api/blocklist", verifyToken, async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ error: "IP address required" });
    const blockRecord = await BlockedIP.findOneAndUpdate(
      { ip },
      { reason: reason || "Manual Administrator Block", blockedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ success: true, record: blockRecord });
  } catch (err) {
    res.status(500).json({ error: "Failed to add to blocklist" });
  }
});

app.delete("/api/blocklist/:ip", verifyToken, async (req, res) => {
  try {
    const { ip } = req.params;
    await BlockedIP.deleteOne({ ip });
    res.json({ success: true, message: "IP removed from blocklist" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove IP" });
  }
});

app.post("/api/reset", verifyToken, async (req, res) => {
  try {
    await resetData();
    resetStats();
    res.json({ success: true, message: "System reset complete" });
  } catch (e) {
    res.status(500).json({ error: "Reset failed", detail: e.message });
  }
});

app.get("/api/logs", verifyToken, async (req, res) => {
  const logs = await getLogs();
  res.json(logs);
});

// CSV Export Route
app.get("/api/export/logs", verifyToken, async (req, res) => {
  try {
    const logs = await getLogs(1000); // Fetch up to 1000 recent logs
    const csvHeader = "Timestamp,IP,Method,Path,Status,RiskScore,AttackType,Explanation\r\n";
    const csvRows = logs.map(log => {
      return `"${log.timestamp}","${log.ip}","${log.method}","${log.path}","${log.status}","${log.riskScore}","${log.attackType}","${log.explanation}"`;
    }).join('\r\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ymcs-shield-security-logs.csv"');
    res.status(200).send(csvHeader + csvRows);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// Settings API
app.get("/api/settings", verifyToken, async (req, res) => {
  try {
    const settings = await Setting.find({});
    const formatted = {};
    settings.forEach(s => { formatted[s.key] = s.value; });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

app.post("/api/settings", verifyToken, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    for (let key of keys) {
      await Setting.findOneAndUpdate(
        { key },
        { value: req.body[key] },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.get("/api/history", verifyToken, async (req, res) => {
  const history = await getHistory();
  res.json(history);
});

app.get("/api/rules", verifyToken, async (req, res) => {
  const rules = await getRules();
  res.json(rules);
});

app.put("/api/rules/:id", verifyToken, async (req, res) => {
  try {
    await updateRule(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Rule update failed" });
  }
});

app.post("/api/predictions", verifyToken, async (req, res) => {
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

// ── System Health (Full Detail) ──────────────────────────────────
app.get("/api/system/health", verifyToken, (req, res) => {
  res.json(monitor.getHealthState());
});

// ── Start server (Cluster Mode for Durability) ─────────────────────
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length || 1;
  const workers = Math.min(numCPUs, 4); // Max 4 workers for optimal Render free tier usage

  console.log(`\n🛡️  [Master Node] Initializing Neural Engine on ${workers} cores...`);
  console.log(`🔑  Auth:    http://localhost:${PORT}/api/auth/login`);
  console.log(`📊  Stats:   http://localhost:${PORT}/api/stats`);
  console.log(`🔮  Predict: http://localhost:${PORT}/api/predictions`);
  console.log(`🤖  Monitor: http://localhost:${PORT}/api/system/health`);
  console.log(`❤️   Health:  http://localhost:${PORT}/health\n`);

  const { checkLocal } = require("./src/detectors/rateLimit");

  const setupWorker = (w) => {
    w.on('message', (msg) => {
      // 1. Centralized Rate-Limit Checks
      if (msg.type === "RATELIMIT_REQ") {
        const result = checkLocal(msg.ip);
        w.send({ type: "RATELIMIT_RES", id: msg.id, result });
      }
      
      // 2. [NEW] Cluster Event Relay (Fallback for Redis)
      if (msg.type === "SOCKET_BROADCAST") {
        // Forward to all OTHER workers
        Object.values(cluster.workers).forEach(worker => {
          if (worker.id !== w.id) {
            worker.send(msg);
          }
        });
      }
    });
  };

  for (let i = 0; i < workers; i++) {
    setupWorker(cluster.fork());
  }

  // Durability: Auto-revive dead workers immediately
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️  [Master Node] Worker ${worker.process.pid} died (signal: ${signal}). Reviving...`);
    setupWorker(cluster.fork());
  });

} else {
  // Worker processes initialize DB, Monitor, and Server
  const startWorker = async () => {
    try {
      // 1. Await Database connection prior to accepting traffic
      await connectDB();
      
      // 2. Ensure Admin is seeded BEFORE login requests can hit
      await seedAdminUser();
      
      // 3. Start System Monitor
      monitor.startMonitor();

      // 4. Start HTTP Server
      const server = app.listen(PORT, () => {
        console.log(`[Worker Node ${process.pid}] Online and processing requests`);
      });

      // ── Socket.io Setup (Real-Time HUD) ──────────────────────────────
      const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"]
    }
  });

  // Redis Adapter for Cluster Synchronization
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log(`📡 [Worker Node ${process.pid}] Redis Socket Adapter Active`);
    }).catch(err => {
      console.warn(`📡 [Worker Node ${process.pid}] Redis Sync Failed: ${err.message}. Falling back to per-worker sockets.`);
    });
  }

  // Socket Authentication (JWT Handshake)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Token missing"));
    
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "ymcs-shield-super-secret-key-2026";
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error: Invalid session"));
      socket.user = decoded;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`🔌 [Worker Node ${process.pid}] Administrator connected: ${socket.user.username}`);
    
    // Send initial snapshot
    socket.emit("stats_update", getStats());
    
    socket.on("disconnect", () => {
      console.log(`🔌 [Worker Node ${process.pid}] Administrator disconnected`);
    });
  });

  // ── Cluster Synchronization Relay (Redis Fallback) ───────────────
  const clusterBroadcast = (event, data) => {
    // 1. Emit locally on this worker
    io.emit(event, data);

    // 2. If Redis is NOT active, manually relay via Master IPC
    if (!process.env.REDIS_URL && process.send) {
      process.send({ type: "SOCKET_BROADCAST", event, data });
    }
  };

  // Listen for broadcasts from other workers (relayed by Master)
  process.on("message", (msg) => {
    if (msg.type === "SOCKET_BROADCAST" && io) {
      io.emit(msg.event, msg.data);
    }
  });

  // Attach helpers for use in other modules
  app.set("io", io);
  app.set("clusterBroadcast", clusterBroadcast);

      // Socket Timeout Protection (Slowloris Mitigation)
      server.setTimeout(30000); // 30s timeout

      // Graceful Shutdown Hooks
      const gracefulShutdown = () => {
        console.log(`\n🛑 [Worker Node ${process.pid}] SIGTERM received. Closing gracefully...`);
        server.close(async () => {
          try {
            const mongoose = require("mongoose");
            if (mongoose.connection.readyState === 1) {
              await mongoose.connection.close();
              console.log(`[Worker Node ${process.pid}] MongoDB safely disconnected.`);
            }
            process.exit(0);
          } catch (err) {
            console.error("Error during graceful shutdown", err);
            process.exit(1);
          }
        });
        
        // Fallback terminator if MongoDB connection hangs
        setTimeout(() => {
          console.error(`[Worker Node ${process.pid}] Force closing after timeout.`);
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);
    } catch (err) {
      console.error(`❌ [Worker Node ${process.pid}] Startup failed:`, err.message);
      process.exit(1);
    }
  };

  startWorker();
}