const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /eval\(/gi,
  /expression\(/gi,
  /<object/gi,
  /<embed/gi,
  /vbscript:/gi,
  /document\.cookie/gi,
  /document\.write/gi,
  /window\.location/gi,
  /<img[^>]+src[^>]*>/gi,
];

const DANGEROUS_TAGS = [
  "script", "iframe", "object",
  "embed", "applet", "meta",
  "link", "style", "base",
];

function detectXSS(input) {
  const str = String(input);

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(str)) {
      return { detected: true, type: "XSS Attack", pattern: pattern.source };
    }
  }

  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}`, "gi");
    if (regex.test(str)) {
      return { detected: true, type: "XSS Attack", tag };
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
    const result = detectXSS(t);
    if (result.detected) return result;
  }
  return { detected: false };
}

module.exports = { scanRequest };