const sqlInjection   = require("./detectors/sqlInjection");
const xss            = require("./detectors/xss");
const pathTraversal  = require("./detectors/pathTraversal");
const commandInject  = require("./detectors/commandInjection");
const rateLimit      = require("./detectors/rateLimit");
const geoBlocking  = require("./detectors/geoBlocking");
const aiGuardian   = require("./detectors/aiGuardian");
const alerts       = require("./utils/alerts");
const logger         = require("./utils/logger");
const { saveLog, updateDailyStats, getRules } = require("./utils/db");

// Stats tracker (synchronized with DB daily)
const stats = {
  total:   0,
  blocked: 0,
  allowed: 0,
};

async function wafMiddleware(req, res, next) {
  stats.total++;
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;

  // Fetch dynamic rules from memory/DB
  const rules = await getRules();
  const getRule = (id) => rules.find(r => r.id === id) || { enabled: true };

  // 1. Rate limit check (RL-205)
  if (getRule("RL-205").enabled) {
    const rateResult = rateLimit.check(ip);
    if (rateResult.limited) {
      stats.blocked++;
      saveToDB(req, { ...rateResult, riskScore: 100 });
      return res.status(429).json({ error: "Rate limit exceeded" });
    }
  }

  // 2. Rule-based checks (SQLi, XSS, Path Traversal, Command Injection)
  const detectors = [
    { id: "RL-101", fn: sqlInjection.scanRequest, type: "SQL Injection" },
    { id: "RL-102", fn: xss.scanRequest,          type: "XSS" },
    { id: "RL-880", fn: pathTraversal.scanRequest, type: "Path Traversal" },
    { id: "RL-990", fn: commandInject.scanRequest, type: "Command Injection" },
  ];

  for (const detector of detectors) {
    if (getRule(detector.id).enabled) {
      const result = detector.fn(req);
      if (result.detected) {
        stats.blocked++;
        saveToDB(req, { ...result, riskScore: 100 });
        return res.status(403).json({ error: "Forbidden", message: result.message || `${detector.type} detected` });
      }
    }
  }

  // 3. AI Guardian (RL-412)
  if (getRule("RL-412").enabled) {
    const hasPayload = (req.query && Object.keys(req.query).length > 0) || (req.body && Object.keys(req.body).length > 0);
    if (hasPayload) {
      const aiResult = await aiGuardian.analyzeRequest(req);
      if (aiResult.detected && aiResult.riskScore > 80) {
        stats.blocked++;
        saveToDB(req, { ...aiResult, source: "AI Guardian" });
        return res.status(403).json({ 
          error: "AI Blocked", 
          message: aiResult.explanation,
          risk: aiResult.riskScore 
        });
      }
      if (aiResult.riskScore > 20) {
        saveToDB(req, { ...aiResult, status: "ALLOWED" });
      }
    }
  }

  // All checks passed — allow request
  stats.allowed++;
  saveToDB(req, { status: "ALLOWED" }, false);
  next();
}

async function saveToDB(req, result, isBlocked = true) {
  try {
    const logData = {
      ip:         req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress,
      method:     req.method,
      path:       req.path,
      status:     isBlocked ? "BLOCKED" : "ALLOWED",
      riskScore:  result.riskScore || 0,
      attackType: result.attackType || result.type || "none",
      explanation:result.explanation || result.message || "",
      country:    result.country || "Localhost",
      payload:    { query: req.query, body: req.body }
    };
    
    // Trigger email alert for critical threats (Risk > 90)
    if (isBlocked && logData.riskScore > 90) {
      alerts.sendAlert({ ...logData, payload: logData.payload }).catch(() => {});
    }
    
    // Save to Memory + DB (via unified helper)
    saveLog(logData).catch(err => console.error("Log save error:", err.message));
    updateDailyStats(isBlocked, logData.attackType);
  } catch (e) {}
}

function getStats() {
  return {
    ...stats,
    blockRate: stats.total ? ((stats.blocked / stats.total) * 100).toFixed(1) : "0.0",
  };
}

module.exports = { wafMiddleware, getStats };