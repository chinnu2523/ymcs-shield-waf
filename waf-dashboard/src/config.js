const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:4000/api" 
  : "https://ymcs-shield-backend.onrender.com/api";

export default API_BASE;
