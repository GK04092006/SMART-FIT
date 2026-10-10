import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * RoleRoute — protects a route to only allowed roles.
 *
 * Usage:
 *   <RoleRoute allowedRoles={['admin']}>
 *     <AdminDashboard />
 *   </RoleRoute>
 *
 * Behaviour:
 *   - Not logged in → redirect to /login
 *   - Wrong role    → redirect to /dashboard with a ?forbidden=1 flag
 *   - Correct role  → render children
 */
const RoleRoute = ({ allowedRoles = [], children, redirectTo = '/dashboard' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`${redirectTo}?forbidden=1`} replace />;
  }

  return children;
};

export default RoleRoute;
