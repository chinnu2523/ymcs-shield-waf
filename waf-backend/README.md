# 🛡️ YMCS Shield Backend

This is the backend service for the **YMCS Shield WAF** project. It provides the core WAF middleware, detection logic, AI analyst integration, and data storage.

## 🏗️ Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   PORT=4000
   ```
3. Run the server:
   ```bash
   npm start
   ```

## 📜 Key Files

- `server.js`: Express server and API endpoints.
- `src/waf.js`: Custom WAF middleware and detection patterns.
- `src/utils/db.js`: MongoDB connection and models.
- `traffic-generator.js`: Automated script to simulate attacks and legitimate traffic.
- `generate-report.js`: Script to generate security PDF reports.

Refer to the root [README](../README.md) for full project documentation.
