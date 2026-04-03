const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const MAX_HEADER_LENGTH = 8192; // 8KB
const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nmap/i,
  /nikto/i,
  /dirbuster/i,
  /gobuster/i,
  /burp/i,
  /metasploit/i,
  /libwww/i,
];

/**
 * Validates the protocol-level aspects of the request.
 * Check methods, header lengths, and common bot/scanner signatures.
 */
function scanRequest(req) {
  // 1. Method validation
  if (!ALLOWED_METHODS.includes(req.method.toUpperCase())) {
    return { 
      detected: true, 
      type: "Protocol Violation", 
      message: `Invalid HTTP method: ${req.method}` 
    };
  }

  // 2. Header analysis
  for (const [key, value] of Object.entries(req.headers)) {
    // Check for excessively long headers
    if (value && value.length > MAX_HEADER_LENGTH) {
      return { 
        detected: true, 
        type: "Protocol Violation", 
        message: `Header ${key} exceeds maximum length` 
      };
    }

    // Check for null bytes or control characters in headers
    if (value && /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
      return { 
        detected: true, 
        type: "Protocol Violation", 
        message: `Corrupted characters detected in header ${key}` 
      };
    }
  }

  // 3. User-Agent analysis (Basic Bot Detection)
  const ua = req.headers["user-agent"] || "";
  for (const pattern of SUSPICIOUS_UA_PATTERNS) {
    if (pattern.test(ua)) {
      return { 
        detected: true, 
        type: "Bot/Scanner Detected", 
        message: `Suspicious User-Agent pattern found: ${pattern.source}`,
        riskScore: 70 
      };
    }
  }

  return { detected: false };
}

module.exports = { scanRequest };
