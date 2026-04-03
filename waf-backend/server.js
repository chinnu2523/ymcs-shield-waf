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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.set('trust proxy', true); // Trust forwarded-for headers for IP identification

// ── WAF sits in front of everything ──────────────────────────────
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

// ── AI Analyst Chat ──────────────────────────────────────────────
app.post("/api/ai/chat", async (req, res) => {
  const { message } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ response: "AI Analyst is in mock mode. Please provide a GEMINI_API_KEY to enable full intelligence." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Fetch recent logs and statistics for better analysis
    const [recentLogs, dailyStats] = await Promise.all([
      Log.find().sort({ timestamp: -1 }).limit(20),
      Stat.find().sort({ date: -1 }).limit(7)
    ]);

    const prompt = `
      You are the Smart WAF AI Analyst, a world-class security specialized LLM.
      
      ## System Context:
      - Total Logs: ${recentLogs.length} recent events provided.
      - 7-Day Stats: ${JSON.stringify(dailyStats)}
      - Current Date: ${new Date().toLocaleDateString()}
      - Recent Incident Log Summary: ${JSON.stringify(recentLogs.map(l => ({ 
          type: l.attackType, 
          status: l.status, 
          risk: l.riskScore,
          ip: l.ip,
          path: l.path
        })))}
      
      ## Task:
      Analyze the user's security-related question based on the provided logs and stats.
      If the user asks about specific threats, provide forensic insights.
      If they ask about general security, give actionable advice based on their current traffic patterns.
      
      User Question: "${message}"
      
      ## Response Requirements:
      - Be professional, concise, and technical.
      - Use markdown for readability (bullet points, bold text).
      - If you note a pattern (e.g., multiple XSS attempts), call it out.
    `;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "AI Error", details: err.message });
  }
});

// ── PDF Report Generation ────────────────────────────────────────
app.get("/api/report/download", async (req, res) => {
  const doc = new PDFDocument();
  const filename = `WAF_Security_Report_${Date.now()}.pdf`;
  
  res.setHeader("Content-disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-type", "application/pdf");
  
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
  doc.pipe(res);
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
  res.json({ status: "WAF is online", uptime: process.uptime() });
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  YMCS Shield Backend running on http://localhost:${PORT}`);
  console.log(`📊  Stats:  http://localhost:${PORT}/api/stats`);
  console.log(`📋  Logs:   http://localhost:${PORT}/api/logs`);
  console.log(`❤️   Health: http://localhost:${PORT}/health\n`);
});