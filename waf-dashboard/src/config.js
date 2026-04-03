// Robust base URL — no string replacement hacks
const BACKEND_BASE = window.location.hostname === "localhost"
  ? "http://localhost:4000"
  : "https://ymcs-shield-backend.onrender.com";

const API_BASE = `${BACKEND_BASE}/api`;

export { BACKEND_BASE };
export default API_BASE;
