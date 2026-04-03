const COMMAND_INJECTION_PATTERNS = [
  // Shell operators and execution patterns
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
  
  // Sensitive Commands (Unix/Linux)
  /\bcat\b(.*\s)+(\/etc\/passwd|\/etc\/shadow)/i,
  /\b(grep|awk|sed)\b/i,
  /\b(curl|wget|nc|netcat|ssh|scp)\b/i,
  /\b(ls|dir|whoami|id|hostname|env)\b/i,
  /\b(ps|top|htop|kill|pkill)\b/i,
  /\b(sudo|su|login)\b/i,
  /\b(perl|python|php|ruby|gcc|g\+\+)\b/i,
  /\b(node|npm|yarn)\b/i,
  /\b(bash|sh|zsh|fish|csh|tcsh)\b/i,
  
  // Sensitive Commands (Windows)
  /\b(powershell|pwsh|cmd|type|copy|del|move|ren)\b/i,
  /\b(net\s+user|net\s+share)\b/i,
  /\b(systeminfo|tasklist|ipconfig)\b/i
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
