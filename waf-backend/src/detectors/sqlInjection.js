const SQL_PATTERNS = [
  // Basic & Common
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  
  // Advanced Union & Join
  /union(.*\s)+(all\s+)*select/i,
  /join(.*\s)+on/i,
  
  // DDL & DML
  /insert(.*\s)+into/i,
  /delete(.*\s)+from/i,
  /drop(.*\s)+table/i,
  /update(.*\s)+set/i,
  /truncate(.*\s)+table/i,
  /alter(.*\s)+table/i,
  
  // Procedures & Execution
  /exec(\s|\+)+(s|x)p\w+/i,
  /call(.*\s)+\w+/i,
  
  // Logical Bypasses
  /or\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+[\'\"]?/i,
  /and\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+[\'\"]?/i,
  / (or|and|xor) .* (=|>|<)/i,
  
  // Time-based Bypasses
  /waitfor\s+delay/i,
  /sleep\s*\(\d+\)/i,
  /benchmark\s*\(\d+,.*\)/i,
  /pg_sleep\s*\(\d+\)/i,
  
  // Encoded/Obfuscated
  /char\s*\(\d+\)/i,
  /unhex\s*\(/i,
  /base64\s*\(/i,
  /x\'[0-9a-fA-F]+\'/i, // Hex string
];

function detectSQLInjection(input) {
  const str = String(input).toLowerCase();
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(str)) {
      return { detected: true, type: "SQL Injection", pattern: pattern.source };
    }
  }
  return { detected: false };
}

function scanRequest(req) {
  const targets = [
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    req.path,
  ];
  for (const t of targets) {
    const result = detectSQLInjection(t);
    if (result.detected) return result;
  }
  return { detected: false };
}

module.exports = { scanRequest };