const SQL_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /union.*select/i,
  /insert.*into/i,
  /delete.*from/i,
  /drop.*table/i,
  /update.*set/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /select.*from/i,
  /or\s+1\s*=\s*1/i,
  /and\s+1\s*=\s*1/i,
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