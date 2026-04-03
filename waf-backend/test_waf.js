const axios = require("axios");

const BASE_URL = "http://localhost:4000";

const attacks = [
  {
    name: "SQL Injection (Query String)",
    url: `${BASE_URL}/api/users?id=1%20OR%201=1`,
    expectedStatus: 403
  },
  {
    name: "XSS Attempt (Body)",
    method: "post",
    url: `${BASE_URL}/api/data`,
    data: { comment: "<script>alert('hack')</script>" },
    headers: { "Content-Type": "application/json" },
    expectedStatus: 403
  },
  {
    name: "Path Traversal",
    url: `${BASE_URL}/api/data?file=../../etc/passwd`,
    expectedStatus: 403
  },
  {
    name: "Safe Request",
    url: `${BASE_URL}/health`,
    expectedStatus: 200
  }
];

async function checkServerRunning() {
  try {
    await axios.get(`${BASE_URL}/health`, { validateStatus: () => true, timeout: 3000 });
    return true;
  } catch (err) {
    return false;
  }
}

async function runTests() {
  console.log("🔍 Pre-flight check: Verifying backend is online...");
  const online = await checkServerRunning();
  if (!online) {
    console.error("❌ FATAL: Backend server is NOT running at http://localhost:4000");
    console.error("   → Run: cd waf-backend && node server.js");
    process.exit(1);
  }
  console.log("✅ Backend online. Running security tests...\n");
  console.log("🚀 Starting WAF Security Verification...\n");
  
  let passed = 0;
  let failed = 0;

  for (const attack of attacks) {
    try {
      const response = await axios({
        method: attack.method || "get",
        url: attack.url,
        data: attack.data,
        headers: attack.headers || {},
        validateStatus: () => true,
        timeout: 5000
      });

      const ok = response.status === attack.expectedStatus;
      if (ok) passed++;
      else failed++;

      console.log(`${ok ? "✅" : "❌"} ${attack.name.padEnd(30)} | Expected: ${attack.expectedStatus} | Got: ${response.status}`);
      
      if (!ok) {
        console.log(`   ↳ Failure: Expected ${attack.expectedStatus} but received ${response.status}`);
        if (response.data) console.log(`   ↳ Body: ${JSON.stringify(response.data).slice(0, 120)}`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ ${attack.name.padEnd(30)} | Network Error: ${err.message}`);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`📊 Results: ${passed}/${attacks.length} passed | ${failed} failed`);
  if (failed === 0) {
    console.log("🏆 ALL SECURITY TESTS PASSED — WAF Operating Correctly!\n");
  } else {
    console.log(`⚠️  ${failed} test(s) failed — review WAF configuration.\n`);
    process.exit(1);
  }
}

runTests();
