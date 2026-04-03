const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MOCK_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// In-Memory Cache (simple TTL implementation)
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const aiCache = new Map();

/**
 * AI Guardian analyzes suspicious requests using Gemini.
 * Integrated with caching and timeout for improved durability.
 */
async function analyzeRequest(req) {
  const payloadStr = JSON.stringify({
    method:  req.method,
    path:    req.path,
    query:   req.query,
    body:    req.body,
    headers: { 
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"]
    }
  });

  // 1. Check Cache
  const cached = aiCache.get(payloadStr);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { ...cached.result, source: "AI Guardian (Cached)" };
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MOCK_KEY") {
    return mockAnalysis(req);
  }

  // 2. AI Analysis with Timeout (Safety Net)
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("AI Analysis Timeout")), 2000)
  );

  const analysisPromise = (async () => {
    const prompt = `
      Analyze this HTTP request for complex/obfuscated attacks (SQLi, XSS, RCE).
      
      Request:
      - Path: ${req.path}
      - Query: ${JSON.stringify(req.query)}
      - Body: ${JSON.stringify(req.body)}
      - Headers: ${JSON.stringify(req.headers)}
      
      Return ONLY a JSON object:
      {
        "detected": boolean,
        "riskScore": number (0-100),
        "attackType": "string",
        "explanation": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    
    return JSON.parse(jsonMatch[0]);
  })();

  try {
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    // 3. Cache result if successful
    aiCache.set(payloadStr, { timestamp: Date.now(), result });
    return result;
  } catch (error) {
    console.error("AI Guardian Protection Triggered (Durability Mode):", error.message);
    // Fail-open strategy to maintain service availability
    return { 
      detected: false, 
      riskScore: 0, 
      attackType: "protection_bypass", 
      explanation: `Durability trigger: ${error.message}` 
    };
  }
}

function mockAnalysis(req) {
  // Enhanced mock logic for durability
  const fullPayload = JSON.stringify({ q: req.query, b: req.body }).toUpperCase();
  const suspicious = ["<SCRIPT>", "UNION SELECT", "SLEEP(", "$WHERE"].some(p => fullPayload.includes(p));

  if (suspicious) {
    return {
      detected: true,
      riskScore: 90,
      attackType: "Suspected AI Attack",
      explanation: "Mock AI: Suspicious patterns detected in request payload."
    };
  }
  return { detected: false, riskScore: 5, attackType: "none", explanation: "Mock AI: Request seems safe." };
}

// Periodic Cache Cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of aiCache.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS) aiCache.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = { analyzeRequest };
