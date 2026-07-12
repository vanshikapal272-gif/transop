/**
 * Role-based access control middleware factory.
 * Usage: rbac('Fleet Manager', 'Dispatcher')
 * Allows request only if req.user.role matches one of the allowed roles.
 */
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
}

module.exports = rbac;
