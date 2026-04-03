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
    data: { large: "A".repeat(1.2 * 1024 * 1024) }, // ~1.2MB
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
    headers: { "User-Agent": "Mozilla/5.0" },
    expectedStatus: 200
  }
];

async function runDurabilityTests() {
  console.log("🛡️ Starting WAF Durability & Protocol Verification...\n");
  
  for (const test of durabilityTests) {
    try {
      const response = await axios({
        method: test.method || "get",
        url: test.url,
        data: test.data,
        headers: test.headers,
        validateStatus: () => true
      });

      const passed = response.status === test.expectedStatus;
      console.log(`${passed ? "✅" : "❌"} ${test.name.padEnd(35)} | Expected: ${test.expectedStatus} | Got: ${response.status}`);
      
      if (!passed) {
        console.log(`   Detailed failure: Expected ${test.expectedStatus} but received ${response.status}`);
        if (response.data) console.log(`   Response Body: ${JSON.stringify(response.data)}`);
      }
    } catch (err) {
      console.log(`❌ ${test.name.padEnd(35)} | Error: ${err.message}`);
    }
  }

  console.log("\n📊 Durability Verification Complete.");
}

runDurabilityTests();
