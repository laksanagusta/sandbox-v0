/**
 * Permission utility functions for role-based access control
 */

export type Permission =
  | "business_trip_verify"
  | "business_trip_manage"
  | "work_paper_sign"
  | "admin";

export interface UserPermissions {
  permissions: Permission[];
  roles: string[];
}

/**
 * Check if user has specific permission
 */
export const hasPermission = (
  user: any,
  requiredPermission: Permission
): boolean => {
  if (!user || !user.permissions) {
    return false;
  }

  return user.permissions.includes(requiredPermission);
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (
  user: any,
  requiredPermissions: Permission[]
): boolean => {
  if (!user || !user.permissions) {
    return false;
  }

  return requiredPermissions.some(permission =>
    user.permissions.includes(permission)
  );
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: any, requiredRole: string): boolean => {
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.includes(requiredRole);
};

/**
 * Check if user can access business trip verifications
 */
export const canAccessBusinessTripVerifications = (user: any): boolean => {
  return hasPermission(user, "business_trip_verify") ||
         hasRole(user, "admin") ||
         hasRole(user, "manager");
};