const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Alerts system for the WAF.
 * Sends email notifications for critical threats.
 */
async function sendAlert(threat) {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("⚠️ Email alerts are not configured. Skipping...");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // Use SSL for 465, TLS for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Smart WAF Monitor" <${process.env.SMTP_USER}>`,
    to: process.env.ALERT_RECIPIENT || process.env.SMTP_USER,
    subject: `🚨 CRITICAL THREAT: ${threat.type} detected from ${threat.ip}`,
    html: `
      <h2>🛡️ Smart WAF Critical Alert</h2>
      <p>A high-risk attack was detected and blocked by the firewall.</p>
      <hr/>
      <ul>
        <li><strong>Attack Type:</strong> ${threat.type}</li>
        <li><strong>Attacker IP:</strong> ${threat.ip}</li>
        <li><strong>Target Path:</strong> ${threat.path}</li>
        <li><strong>Risk Score:</strong> ${threat.riskScore}%</li>
        <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p><strong>Payload Details:</strong></p>
      <pre>${JSON.stringify(threat.payload, null, 2)}</pre>
      <hr/>
      <p>View full logs in your <a href="http://localhost:3000">Dashboard</a>.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ WAF Alert: Critical threat email dispatched.");
  } catch (err) {
    // Log once as a warning to avoid cluttering the production/dev logs
    if (!global.emailWarned) {
      console.warn("⚠️  WAF Alert: Email delivery failed. Check SMTP config.");
      global.emailWarned = true;
    }
  }
}

module.exports = { sendAlert };
