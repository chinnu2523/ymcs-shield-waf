const xss = require("./waf-backend/src/detectors/xss");

const testCases = [
    { input: '<img src="https://example.com/photo.jpg">', expected: false, label: "Plain IMG tag" },
    { input: '<svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>', expected: false, label: "Plain SVG (circle)" },
    { input: '<div><p>Hello World</p><img src="/path/to/img"></div>', expected: false, label: "Nested IMG tag" },
    { input: '<script>alert(1)</script>', expected: true, label: "Malicious Script Tag" },
    { input: '<img src="x" onerror="alert(1)">', expected: true, label: "IMG with Event Handler (onerror)" },
    { input: '<svg onload="alert(1)">', expected: true, label: "SVG with Event Handler (onload)" },
    { input: '<a href="javascript:alert(1)">Click Me</a>', expected: true, label: "Javascript URL" }
];

let allPassed = true;
testCases.forEach(tc => {
    const req = { query: { q: tc.input }, body: {}, path: "/" };
    const result = xss.scanRequest(req);
    const passed = result.detected === tc.expected;
    console.log(`[${passed ? "PASS" : "FAIL"}] ${tc.label}: Input="${tc.input.substring(0, 50)}..." | Detected=${result.detected}`);
    if (!passed) allPassed = false;
});

if (allPassed) {
    console.log("\n✅ All XSS detector tests passed!");
} else {
    console.log("\n❌ Some XSS detector tests failed.");
    process.exit(1);
}
