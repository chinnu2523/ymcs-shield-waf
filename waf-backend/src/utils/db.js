const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smart-waf";
let isDBConnected = false;

// ── In-Memory Data Store (Fallback) ────────────────────────────────
const MEMORY_LOGS  = [];
const MEMORY_STATS = new Map(); // Date -> Stat Object
const MAX_MEMORY_LOGS = 200;

// Default WAF Rules
const DEFAULT_RULES = [
  { id: "RL-101", name: "Block SQL Injection", type: "WAF Core", enabled: true,  severity: "High", detector: "sqlInjection" },
  { id: "RL-102", name: "XSS Tag Sanitization", type: "WAF Core", enabled: true,  severity: "Medium", detector: "xss" },
  { id: "RL-205", name: "Rate Limit: Global",   type: "Dynamic",  enabled: true,  severity: "High", detector: "rateLimit" },
  { id: "RL-412", name: "Neural Bot Detector",  type: "Neural",   enabled: true,  severity: "Medium", detector: "ai" },
  { id: "RL-880", name: "Path Traversal Filter",type: "WAF Core", enabled: true,  severity: "High", detector: "pathTraversal" },
  { id: "RL-990", name: "Command Injection",    type: "WAF Core", enabled: true,  severity: "High", detector: "commandInjection" },
];

let MEMORY_RULES = JSON.parse(JSON.stringify(DEFAULT_RULES));

async function connectDB() {
  try {
    // Reduce timeout for faster fallback
    await mongoose.connect(MONGO_URI, { 
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false // Disable buffering to prevent hangs when DB is down
    });
    isDBConnected = true;
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    isDBConnected = false;
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.log("⚠️  Falling back to in-memory persistence layer");
  }
}

// ── Schemas ────────────────────────────────────────────────────────

const RequestSchema = new mongoose.Schema({
  timestamp:  { type: Date, default: Date.now },
  ip:         { type: String, required: true },
  method:     { type: String, required: true },
  path:       { type: String, required: true },
  status:     { type: String, enum: ["ALLOWED", "BLOCKED"], required: true },
  riskScore:  { type: Number, default: 0 },
  attackType: { type: String, default: "none" },
  explanation:{ type: String, default: "" },
  payload:    { type: Object }
});

const StatSchema = new mongoose.Schema({
  date:      { type: String, unique: true },
  total:     { type: Number, default: 0 },
  allowed:   { type: Number, default: 0 },
  blocked:   { type: Number, default: 0 },
  topAttack: { type: String, default: "none" }
});

const RuleSchema = new mongoose.Schema({
  id:       { type: String, unique: true },
  name:     String,
  type:     String,
  enabled:  Boolean,
  severity: String,
  detector: String
});

const Log = mongoose.model("Log", RequestSchema);
const Stat = mongoose.model("Stat", StatSchema);
const Rule = mongoose.model("Rule", RuleSchema);

async function saveLog(logData) {
  // Always save to memory for speed and fallback
  MEMORY_LOGS.unshift({ ...logData, timestamp: new Date() });
  if (MEMORY_LOGS.length > MAX_MEMORY_LOGS) MEMORY_LOGS.pop();

  if (isDBConnected) {
    Log.create(logData).catch(err => console.error("DB Log Save Error:", err.message));
  }
}

async function getLogs(limit = 100) {
  if (isDBConnected) {
    try {
      return await Log.find().sort({ timestamp: -1 }).limit(limit);
    } catch (e) {
      return MEMORY_LOGS.slice(0, limit);
    }
  }
  return MEMORY_LOGS.slice(0, limit);
}

async function updateDailyStats(isBlocked = false, attackType = "none") {
  const date = new Date().toISOString().split("T")[0];
  
  // 1. Update Memory
  if (!MEMORY_STATS.has(date)) {
    MEMORY_STATS.set(date, { date, total: 0, allowed: 0, blocked: 0, topAttack: "none" });
  }
  const stat = MEMORY_STATS.get(date);
  stat.total++;
  if (isBlocked) {
    stat.blocked++;
    if (attackType !== "none") stat.topAttack = attackType;
  } else {
    stat.allowed++;
  }

  // 2. Update DB if connected
  if (isDBConnected) {
    try {
      const update = {
        $inc: { total: 1, [isBlocked ? "blocked" : "allowed"]: 1 }
      };
      if (isBlocked && attackType !== "none") update.$set = { topAttack: attackType };
      await Stat.findOneAndUpdate({ date }, update, { upsert: true, returnDocument: 'after' });
    } catch (err) {}
  }
}

async function getHistory(limit = 20) {
  if (isDBConnected) {
    try {
      const history = await Stat.find().sort({ date: -1 }).limit(limit);
      return history.reverse();
    } catch (e) {
      return Array.from(MEMORY_STATS.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-limit);
    }
  }
  return Array.from(MEMORY_STATS.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-limit);
}

async function getRules() {
  if (isDBConnected) {
    try {
      const dbRules = await Rule.find();
      if (dbRules.length > 0) return dbRules;
      // Initialize DB with defaults if empty
      await Rule.insertMany(DEFAULT_RULES);
      return DEFAULT_RULES;
    } catch (e) {
      return MEMORY_RULES;
    }
  }
  return MEMORY_RULES;
}

async function updateRule(id, updates) {
  // Update Memory
  const ruleIdx = MEMORY_RULES.findIndex(r => r.id === id);
  if (ruleIdx !== -1) {
    MEMORY_RULES[ruleIdx] = { ...MEMORY_RULES[ruleIdx], ...updates };
  }

  // Update DB if connected
  if (isDBConnected) {
    try {
      await Rule.findOneAndUpdate({ id }, updates, { returnDocument: 'after' });
    } catch (err) {}
  }
}

module.exports = { connectDB, Log, Stat, Rule, saveLog, getLogs, updateDailyStats, getHistory, getRules, updateRule };
