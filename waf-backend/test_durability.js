const axios = require("axios");

const BASE_URL = "http://localhost:4000";

const durabilityTests = [
  {
    name: "Protocol Violation (TRACE Method)",
    method: "trace",
    url: `${BASE_URL}/api/data`,
    expectedStatus: 403
  },
  {
    name: "Payload Size Limit (DoS Protection)",
    method: "post",
    url: `${BASE_URL}/api/data`,
    // Send large raw body — Content-Length header will be set correctly by axios
    data: "A".repeat(1.2 * 1024 * 1024),
    headers: { "Content-Type": "text/plain" },
    expectedStatus: 413
  },
  {
    name: "Bot Detection (User-Agent sqlmap)",
    method: "get",
    url: `${BASE_URL}/api/users`,
    headers: { "User-Agent": "sqlmap/1.4.1" },
    expectedStatus: 403
  },
  {
    name: "Safe Request (Normal User)",
    method: "get",
    url: `${BASE_URL}/api/users`,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Chrome/120)" },
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

async function runDurabilityTests() {
  console.log("🔍 Pre-flight check: Verifying backend is online...");
  const online = await checkServerRunning();
  if (!online) {
    console.error("❌ FATAL: Backend server is NOT running at http://localhost:4000");
    console.error("   → Run: cd waf-backend && node server.js");
    process.exit(1);
  }
  console.log("✅ Backend online. Running durability tests...\n");
  console.log("🛡️ Starting WAF Durability & Protocol Verification...\n");

  let passed = 0;
  let failed = 0;
  
  for (const test of durabilityTests) {
    try {
      const response = await axios({
        method: test.method || "get",
        url: test.url,
        data: test.data,
        headers: { ...(test.headers || {}) },
        validateStatus: () => true,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 10000
      });

      const ok = response.status === test.expectedStatus;
      if (ok) passed++;
      else failed++;

      console.log(`${ok ? "✅" : "❌"} ${test.name.padEnd(40)} | Expected: ${test.expectedStatus} | Got: ${response.status}`);
      
      if (!ok) {
        console.log(`   ↳ Failure: Expected ${test.expectedStatus} but received ${response.status}`);
        if (response.data) console.log(`   ↳ Body: ${JSON.stringify(response.data).slice(0, 120)}`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ ${test.name.padEnd(40)} | Network Error: ${err.message}`);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`📊 Results: ${passed}/${durabilityTests.length} passed | ${failed} failed`);
  if (failed === 0) {
    console.log("🏆 ALL DURABILITY TESTS PASSED — WAF Is Rock-Solid!\n");
  } else {
    console.log(`⚠️  ${failed} test(s) failed — review WAF configuration.\n`);
    process.exit(1);
  }
}

runDurabilityTests();
