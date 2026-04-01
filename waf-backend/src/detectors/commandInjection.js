const COMMAND_INJECTION_PATTERNS = [
  /`[^`]*`/g,           // Backticks
  /\$\([^)]*\)/g,       // $() syntax
  /\$\{[^}]*\}/g,       // ${} syntax
  /[;&|<>]/g,           // Shell operators
  /\bexec\b/gi,         // exec command
  /\bsystem\b/gi,       // system command
  /\bshell_exec\b/gi,   // shell_exec
  /\bpassthru\b/gi,     // passthru
  /\bproc_open\b/gi,    // proc_open
  /\beval\b/gi,         // eval
  /\brm\s+-/gi,         // rm command with flags
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
