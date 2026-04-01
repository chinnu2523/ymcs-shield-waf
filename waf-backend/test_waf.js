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

async function runTests() {
  console.log("🚀 Starting WAF Security Verification...\n");
  
  for (const attack of attacks) {
    try {
      const response = await axios({
        method: attack.method || "get",
        url: attack.url,
        data: attack.data,
        validateStatus: () => true
      });

      const passed = response.status === attack.expectedStatus;
      console.log(`${passed ? "✅" : "❌"} ${attack.name.padEnd(30)} | Expected: ${attack.expectedStatus} | Got: ${response.status}`);
      
      if (!passed) {
        console.log(`   Detailed failure: Expected ${attack.expectedStatus} but received ${response.status}`);
      }
    } catch (err) {
      console.log(`❌ ${attack.name.padEnd(30)} | Error: ${err.message}`);
    }
  }

  console.log("\n📊 Verification Complete.");
}

runTests();
