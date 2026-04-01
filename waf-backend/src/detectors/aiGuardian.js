const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MOCK_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * AI Guardian analyzes suspicious requests using Gemini.
 * It's only called when rules aren't 100% sure, to save cost and latency.
 */
async function analyzeRequest(req) {
  if (!process.env.GEMINI_API_KEY) {
    // Return a mock result to avoid breaking the WAF if no key is provided
    return mockAnalysis(req);
  }

  const payload = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip,
    path: req.path
  };

  const prompt = `
    You are an advanced Cyber Security AI powered by Google Gemini, operating as a core component of a Smart WAF.
    Analyze the following HTTP request for complex, obfuscated, or zero-day attack patterns (SQLi, XSS, RCE, LFI, etc.).
    
    Request Context:
    - Method: ${payload.method}
    - Path: ${payload.path}
    - IP: ${payload.ip}
    - Headers: ${JSON.stringify(payload.headers)}
    - Query Params: ${JSON.stringify(payload.query)}
    - Body: ${JSON.stringify(payload.body)}
    
    Instructions:
    1. Look for encoded payloads (Base64, Hex, URL encoding).
    2. Check for logic bypasses or unusual parameter combinations.
    3. Evaluate the risk score from 0 (Safe) to 100 (Critical Threat).
    
    Return ONLY a JSON object:
    {
      "detected": boolean,
      "riskScore": number,
      "attackType": "string",
      "explanation": "Provide a professional security forensic summary"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (sometimes models add markdown formatting)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { detected: false, riskScore: 0, attackType: "none", explanation: "AI could not parse response" };
  } catch (error) {
    console.error("AI Guardian Error:", error.message);
    return { detected: false, riskScore: 0, attackType: "error", explanation: "AI bypass due to error" };
  }
}

function mockAnalysis(req) {
  // Simple mock logic for demonstration without API key
  const queryStr = req.query ? JSON.stringify(req.query) : "{}";
  const bodyStr  = req.body ? JSON.stringify(req.body) : "{}";
  const fullPayload = (queryStr + bodyStr).toUpperCase();

  const suspicious = 
    fullPayload.includes("<SCRIPT>") || 
    fullPayload.includes("UNION SELECT") ||
    fullPayload.includes("$NE") || 
    fullPayload.includes("$GT") ||
    fullPayload.includes("$WHERE");

  if (suspicious) {
    return {
      detected: true,
      riskScore: 95,
      attackType: "AI-Predicted Threat",
      explanation: "Mock AI detected suspicious pattern (Injection/XSS) in payload."
    };
  }
  return { detected: false, riskScore: 5, attackType: "none", explanation: "Mock AI: Request seems safe." };
}

module.exports = { analyzeRequest };
