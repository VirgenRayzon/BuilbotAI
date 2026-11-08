/**
 * Auth Utilities — Centralized role definitions and permission checks.
 * Used by RouteGuard and Middleware to enforce access control.
 */

export type UserRole = 'guest' | 'user' | 'manager' | 'superadmin';

/**
 * Derives the effective role from a user profile object.
 */
export const getEffectiveRole = (profile: any): UserRole => {
    if (!profile) return 'guest';
    if (profile.isSuperAdmin) return 'superadmin';
    if (profile.isManager) return 'manager';
    return 'user';
};

/**
 * Permission checks for specific areas of the application.
 */
export const AuthPermissions = {
    canAccessAdmin: (role: UserRole) => role === 'manager' || role === 'superadmin',
    
    isSuperAdmin: (role: UserRole) => role === 'superadmin',
    
    isRegisteredUser: (role: UserRole) => role !== 'guest',

    isClientOnly: (role: UserRole) => role === 'user',

    canUseBuilder: (role: UserRole) => role === 'guest' || role === 'user',
    
    isInclusive: (role: UserRole) => role !== 'guest'
};

/**
 * Route Mapping — Defines which routes require which permissions.
 */
export const RouteRequirements: Record<string, keyof typeof AuthPermissions> = {
    '/admin': 'canAccessAdmin',
    '/profile': 'isRegisteredUser',
    '/builder': 'canUseBuilder',
    '/ai-build-advisor': 'isClientOnly',
};
