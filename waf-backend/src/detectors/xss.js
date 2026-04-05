const XSS_PATTERNS = [
  // Scripts & Injections
  /<script[^>]*>[\s\S]*?<\/script>/i,
  /javascript:/i,
  /vbscript:/i,
  /expression\(/i,
  /eval\(/i,
  
  // Event Handlers (Catch all onX= patterns)
  /on\w+\s*=\s*[\"\'\s]*[\w\s\(\)]+/i,
  
  // Doms & Resources
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<applet/i,
  /<link[^>]+href[^>]+javascript:/i,
  /<form[^>]+action[^>]+javascript:/i,
  
  // Encoding & Data URIs
  /data:text\/html/i,
  /base64\s*,/i,
  
  // Document Object Access
  /document\.cookie/i,
  /document\.write/i,
  /window\.location/i,
  
  // SVG Injections (Only malicious ones)
  /<svg[^>]*\son[a-z]+\s*=/i,

  // Remove broad img/svg blocks to prevent false positives — only block specific event handlers
  // The global event handler pattern on line 10 already catches most of these.
];

const DANGEROUS_TAGS = [
  "script", "iframe", "object",
  "embed", "applet", "meta",
  "link", "style", "base"
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