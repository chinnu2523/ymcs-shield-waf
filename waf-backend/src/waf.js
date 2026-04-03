const sqlInjection   = require("./detectors/sqlInjection");
const xss            = require("./detectors/xss");
const pathTraversal  = require("./detectors/pathTraversal");
const commandInject  = require("./detectors/commandInjection");
const rateLimit      = require("./detectors/rateLimit");
const geoBlocking    = require("./detectors/geoBlocking");
const aiGuardian     = require("./detectors/aiGuardian");
const protocolVal    = require("./detectors/protocolValidator");
const alerts         = require("./utils/alerts");
const logger         = require("./utils/logger");
const { updateDailyStats, getRules } = require("./utils/db");
const { addLog } = require("./utils/logBuffer");

// Configuration for Durability
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024; // 1MB limit for body/query

// Stats tracker (synchronized with DB daily)
const stats = {
  total:   0,
  blocked: 0,
  allowed: 0,
  latency: 0, // In Milliseconds
};

async function wafMiddleware(req, res, next) {
  const start = process.hrtime();
  
  // Track latency for ALL requests (Blocked or Allowed)
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
    
    // Internal float-based rolling average for precision
    if (stats.latency === 0) {
      stats.latency = durationMs;
    } else {
      stats.latency = (stats.latency * 0.9) + (durationMs * 0.1);
    }
  });

  let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  if (ip && typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  stats.total++;
  console.log(`🔍 [WAF] Request: ${req.method} ${req.url} from ${ip}`);

  try {
    // 0. Payload Size Check (Durability - DoS Protection)
    const payloadSize = (JSON.stringify(req.body || {}).length) + (JSON.stringify(req.query || {}).length);
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      stats.blocked++;
      saveToDB(req, ip, { detected: true, type: "DoS Protection", explanation: "Payload size too large", riskScore: 100 });
      return res.status(413).json({ error: "Payload Too Large" });
    }

    // Fetch dynamic rules
    const rules = await getRules();
    const getRule = (id) => rules.find(r => r.id === id) || { enabled: true };

    // 1. Protocol Validation
    const protoResult = protocolVal.scanRequest(req);
    if (protoResult.detected) {
      stats.blocked++;
      saveToDB(req, ip, { ...protoResult, riskScore: protoResult.riskScore || 100 });
      return res.status(403).json({ error: "Forbidden", message: protoResult.message });
    }

    // 2. Rate limit check (RL-205)
    if (getRule("RL-205").enabled) {
      const rateResult = rateLimit.check(ip);
      if (rateResult.limited) {
        stats.blocked++;
        saveToDB(req, ip, { ...rateResult, riskScore: 100 });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
    }

    // 3. Rule-based checks (SQLi, XSS, Path Traversal, Command Injection)
    const detectors = [
      { id: "RL-101", fn: sqlInjection.scanRequest, type: "SQL Injection" },
      { id: "RL-102", fn: xss.scanRequest,          type: "XSS" },
      { id: "RL-880", fn: pathTraversal.scanRequest, type: "Path Traversal" },
      { id: "RL-990", fn: commandInject.scanRequest, type: "Command Injection" },
    ];

    for (const detector of detectors) {
      if (getRule(detector.id).enabled) {
        try {
          const result = detector.fn(req);
          if (result.detected) {
            stats.blocked++;
            saveToDB(req, ip, { ...result, riskScore: 100 });
            console.log(`🛡️  [WAF BLOCKED] ${detector.type} detected on ${req.url}`);
            return res.status(403).json({ error: "Forbidden", message: result.message || `${detector.type} detected` });
          }
        } catch (detError) {
          console.error(`Detector Error (${detector.type}):`, detError.message);
          // Durability: Fail-open if a single detector fails
        }
      }
    }

    // 4. AI Guardian (RL-412)
    if (getRule("RL-412").enabled) {
      const hasPayload = (req.query && Object.keys(req.query).length > 0) || (req.body && Object.keys(req.body).length > 0);
      if (hasPayload) {
        const aiResult = await aiGuardian.analyzeRequest(req);
        if (aiResult.detected && aiResult.riskScore > 80) {
          stats.blocked++;
          saveToDB(req, ip, { ...aiResult, source: "AI Guardian" });
          return res.status(403).json({ 
            error: "AI Blocked", 
            message: aiResult.explanation,
            risk: aiResult.riskScore 
          });
        }
        if (aiResult.riskScore > 20) {
          saveToDB(req, ip, { ...aiResult, status: "ALLOWED" });
        }
      }
    }

    // All checks passed — allow request
    stats.allowed++;
    saveToDB(req, ip, { status: "ALLOWED" }, false);
    

    next();
  } catch (globalError) {
    console.error("CRITICAL WAF FAILURE:", globalError.message);
    // Durability: If the WAF itself has a critical failure, we allow the request but log the error
    // This prevents the WAF from becoming a single point of failure for the application
    next();
  }
}

async function saveToDB(req, ip, result, isBlocked = true) {
  try {
    const logData = {
      ip:         ip,
      method:     req.method,
      path:       req.path,
      status:     isBlocked ? "BLOCKED" : "ALLOWED",
      riskScore:  result.riskScore || 0,
      attackType: result.attackType || result.type || "none",
      explanation:result.explanation || result.message || "",
      country:    result.country || "Localhost",
      payload:    { query: req.query, body: req.body }
    };
    
    if (isBlocked && logData.riskScore > 90) {
      alerts.sendAlert({ ...logData, payload: logData.payload }).catch(() => {});
    }
    
    // Performance: Use buffered logging to reduce DB pressure
    addLog(logData);
    updateDailyStats(isBlocked, logData.attackType);
  } catch (e) {}
}

function getStats() {
  return {
    ...stats,
    latency: Math.max(1, Math.round(stats.latency)), // Round only for display, floor at 1ms
    blockRate: stats.total ? ((stats.blocked / stats.total) * 100).toFixed(1) : "0.0",
  };
}

function resetStats() {
  stats.total   = 0;
  stats.blocked = 0;
  stats.allowed = 0;
  stats.latency = 0;
  console.log("♻️  WAF Stats Reset Complete");
}

module.exports = { wafMiddleware, getStats, resetStats };