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
    // Admin Dashboard access (Managers and Super Admins)
    canAccessAdmin: (role: UserRole) => role === 'manager' || role === 'superadmin',
    
    // Super Admin only features (Sales, Site Settings)
    isSuperAdmin: (role: UserRole) => role === 'superadmin',
    
    // Registered user features (Profile, Reservations)
    isRegisteredUser: (role: UserRole) => role !== 'guest',

    // Strictly for end-users (PC Builder, AI Advisor)
    // Managers/Admins visiting these will be redirected to /admin
    isClientOnly: (role: UserRole) => role === 'user',
    
    // Public features that admins shouldn't be kicked out of (Pre-builts)
    isInclusive: (role: UserRole) => role !== 'guest'
};

/**
 * Route Mapping — Defines which routes require which permissions.
 */
export const RouteRequirements: Record<string, keyof typeof AuthPermissions> = {
    '/admin': 'canAccessAdmin',
    '/profile': 'isRegisteredUser',
    '/builder': 'isClientOnly',
    '/ai-build-advisor': 'isClientOnly',
};
