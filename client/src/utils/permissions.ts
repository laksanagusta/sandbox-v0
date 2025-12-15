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

/**
 * Permission object structure from whoami endpoint
 */
export interface PermissionObject {
  id: string;
  name: string;
  resource: string;
  action: string;
}

/**
 * Check if user has a specific permission using "resource:action" format
 * Example: hasAccess(user, "setting:read")
 */
export const hasAccess = (user: any, permission: string): boolean => {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  const [resource, action] = permission.split(":");
  if (!resource || !action) {
    console.warn(`Invalid permission format: "${permission}". Expected "resource:action"`);
    return false;
  }

  return user.permissions.some(
    (perm: PermissionObject) =>
      perm.resource === resource && perm.action === action
  );
};

/**
 * Check if user has ALL of the specified permissions
 * Example: hasAllAccess(user, ["setting:read", "setting:update"])
 */
export const hasAllAccess = (user: any, permissions: string[]): boolean => {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return permissions.every((permission) => hasAccess(user, permission));
};

/**
 * Check if user has ANY of the specified permissions
 * Example: hasAnyAccess(user, ["setting:read", "setting:write"])
 */
export const hasAnyAccess = (user: any, permissions: string[]): boolean => {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return permissions.some((permission) => hasAccess(user, permission));
};

