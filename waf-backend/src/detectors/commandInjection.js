// Patterns that require SHELL CONTEXT — must be preceded by shell operators
// to avoid matching innocent URL paths like /api/system/health
const SHELL_CONTEXT = /[;|&`$(){}<>\n]|^|\s/;

const COMMAND_INJECTION_PATTERNS = [
  // Shell operators and execution patterns (these are always suspicious in URLs/bodies)
  /`[^`]*\S[^`]*`/,      // Backtick execution (non-empty)
  /\$\([^)]+\)/,          // $() command substitution
  /\$\{IFS[^}]*\}/,       // ${IFS} special variable

  // These only match when combined with shell meta-chars (not standalone words)
  /[;|&]\s*\b(exec|eval|bash|sh|zsh|powershell|pwsh|cmd)\b/i,
  /\bcat\s+\/etc\/(passwd|shadow)/i,
  /\brm\s+-[rf]/i,             // rm with flags is always suspicious
  /\b(shell_exec|passthru|proc_open)\b/i, // PHP functions are always suspicious
  /\b(curl|wget|nc|netcat)\s+/i,           // download tools followed by a space = suspicious
  /\b(sudo|su)\s+/i,                       // privilege escalation with argument
  /\bnet\s+(user|share|localgroup)/i,      // Windows net commands
];

// Paths owned by the WAF itself — never scan these for command injection
const EXEMPT_PATHS = [
  /^\/api\/system/,
  /^\/health/,
  /^\/api\/stats/,
  /^\/api\/logs/,
  /^\/api\/rules/,
  /^\/api\/history/,
  /^\/api\/predictions/,
  /^\/api\/userdashboard/,
  /^\/api\/reset/,
  /^\/api\/ai/,
  /^\/api\/report/,
];

function detectCommandInjection(input) {
  const str = String(input);
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      return { detected: true, type: "Command Injection Attack", pattern: pattern.source };
    }
  }
  return { detected: false };
}

function scanRequest(req) {
  // Skip scanning WAF's own internal endpoints
  if (EXEMPT_PATHS.some(p => p.test(req.path))) {
    return { detected: false };
  }

  const targets = [
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    req.path,
  ];
  for (const t of targets) {
    const result = detectCommandInjection(t);
    if (result.detected) return result;
  }
  return { detected: false };
}

module.exports = { scanRequest };
