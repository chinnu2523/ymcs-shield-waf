const XSS_PATTERNS = [
  // Scripts & Injections
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /expression\(/gi,
  /eval\(/gi,
  
  // Event Handlers (Catch all onX= patterns)
  /on\w+\s*=\s*[\"\'\s]*[\w\s\(\)]+/gi,
  
  // Doms & Resources
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<applet/gi,
  /<link[^>]+href[^>]+javascript:/gi,
  /<form[^>]+action[^>]+javascript:/gi,
  
  // Encoding & Data URIs
  /data:text\/html/gi,
  /base64\s*,/gi,
  
  // Document Object Access
  /document\.cookie/gi,
  /document\.write/gi,
  /window\.location/gi,
  
  // SVG Injections
  /<svg[^>]*onload/gi,
  /<svg[^>]*onmouseover/gi,
  
  // Malformed Tags
  /<img[^>]+src[^>]*>/gi,
  /<svg[^>]*>/gi,
];

const DANGEROUS_TAGS = [
  "script", "iframe", "object",
  "embed", "applet", "meta",
  "link", "style", "base",
  "form", "svg", "body", "html",
  "video", "audio", "source"
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