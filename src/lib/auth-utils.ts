
export type UserRole = 'guest' | 'user' | 'manager' | 'superadmin';

export const getEffectiveRole = (profile: any): UserRole => {
    if (!profile) return 'guest';
    if (profile.isSuperAdmin) return 'superadmin';
    if (profile.isManager) return 'manager';
    return 'user';
};

export const AuthPermissions = {
    canAccessAdmin: (role: UserRole) => role === 'manager' || role === 'superadmin',
    
    isSuperAdmin: (role: UserRole) => role === 'superadmin',
    
    isRegisteredUser: (role: UserRole) => role !== 'guest',

    isClientOnly: (role: UserRole) => role === 'user',

    canUseBuilder: (role: UserRole) => role === 'guest' || role === 'user',
    
    isInclusive: (role: UserRole) => role !== 'guest'
};

export const RouteRequirements: Record<string, keyof typeof AuthPermissions> = {
    '/admin': 'canAccessAdmin',
    '/profile': 'isRegisteredUser',
    '/builder': 'canUseBuilder',
    '/ai-build-advisor': 'isClientOnly',
};
