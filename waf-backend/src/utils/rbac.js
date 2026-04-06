/**
 * Middleware for Role-Based Access Control (RBAC)
 * Authorizes a request based on the user's role from the JWT token.
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = req.user;

    // superadmin has universal access
    if (role === 'superadmin') {
      return next();
    }

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      error: "Access Denied: Insufficient Neural Clearances",
      required: allowedRoles.join(" | ")
    });
  };
}

module.exports = authorize;
