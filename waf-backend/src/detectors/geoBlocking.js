const geoip = require("geoip-lite");
require("dotenv").config();

/**
 * Geo-IP Blocking identifies the origin of a request and 
 * blocks specific countries based on a blacklist.
 */
function check(ip) {
  // In development, local IPs (::1, 127.0.0.1) don't have geo data
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.0.0.1")) {
    return { blocked: false, country: "Localhost" };
  }

  const geo = geoip.lookup(ip);
  if (!geo) {
    return { blocked: false, country: "Unknown" };
  }

  const blockedCountries = (process.env.BLOCKED_COUNTRIES || "").split(",");
  const country = geo.country;

  if (blockedCountries.includes(country)) {
    return {
      blocked: true,
      country: country,
      type: "Geo-Block",
      message: `Access denied for requests from ${country}`
    };
  }

  return { blocked: false, country: country };
}

module.exports = { check };
