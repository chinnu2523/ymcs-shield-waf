const { saveLog } = require("./db");

let buffer = [];
const BUFFER_LIMIT = 50;
const FLUSH_INTERVAL_MS = 10000; // 10 seconds

function addLog(logData) {
  buffer.push(logData);
  
  if (buffer.length >= BUFFER_LIMIT) {
    flush();
  }
}

async function flush() {
  if (buffer.length === 0) return;
  
  const logsToSave = [...buffer];
  buffer = [];
  
  try {
    // Save logs in parallel for performance
    await Promise.all(logsToSave.map(log => saveLog(log).catch(err => {
        console.error("Critical: Failed to save log to DB:", err.message);
    })));
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📡 [WAF LogBuffer] Flushed ${logsToSave.length} logs to database.`);
    }
  } catch (e) {
    console.error("LogBuffer Flush Error:", e.message);
  }
}

// Ensure logs are flushed periodically even if limit isn't reached
setInterval(flush, FLUSH_INTERVAL_MS);

// Final flush on process exit
process.on('SIGTERM', flush);
process.on('SIGINT', flush);

module.exports = { addLog, flush };
