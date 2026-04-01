const PATH_PATTERNS = [
  /\.\.\//g,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%2e%2e%2f/gi,
  /%2e%2e\//gi,
  /\.\.%255c/gi,
  /etc\/passwd/gi,
  /etc\/shadow/gi,
  /windows\/system32/gi,
  /boot\.ini/gi,
  /proc\/self/gi,
];

function detectPathTraversal(input) {
  const str = String(input);
  for (const pattern of PATH_PATTERNS) {
    if (pattern.test(str)) {
      return { detected: true, type: "Path Traversal", pattern: pattern.source };
    }
  }
  return { detected: false };
}

function scanRequest(req) {
  const targets = [
    req.path,
    JSON.stringify(req.query),
    JSON.stringify(req.body),
  ];
  for (const t of targets) {
    const result = detectPathTraversal(t);
    if (result.detected) return result;
  }
  return { detected: false };
}

module.exports = { scanRequest };