export const permissions = [
    { key: 'VIEW_DASHBOARD', name: 'Dashboard' },
    { key: 'VIEW_BOOKINGS', name: 'Bookings' },
    { key: 'VIEW_TOURS', name: 'Tours' },
    { key: 'VIEW_BLOGS', name: 'Blogs' },
    { key: 'VIEW_INQUIRIES', name: 'Inquiries' },
    { key: 'VIEW_CUSTOMERS', name: 'Customers' },
    { key: 'VIEW_FINANCE', name: 'Finance' },
    { key: 'VIEW_REPORTS', name: 'Reports' },
    { key: 'VIEW_NAVIGATION', name: 'Navigation' },
    { key: 'VIEW_SETTINGS', name: 'Settings' },
    { key: 'VIEW_USERS', name: 'Users' },
    { key: 'VIEW_NEWSLETTERS', name: 'Newsletters' },
] as const;

export type PermissionKey = (typeof permissions)[number]['key'];

export const allPermissionKeys = [
    'VIEW_DASHBOARD',
    'VIEW_BOOKINGS',
    'VIEW_TOURS',
    'VIEW_BLOGS',
    'VIEW_INQUIRIES',
    'VIEW_CUSTOMERS',
    'VIEW_FINANCE',
    'VIEW_REPORTS',
    'VIEW_NAVIGATION',
    'VIEW_SETTINGS',
    'VIEW_USERS',
    'VIEW_NEWSLETTERS',
] as const;

export const rolePermissionDefaults: Record<string, PermissionKey[]> = {
    SUPER_ADMIN: [...allPermissionKeys],
    ADMIN: [...allPermissionKeys],
    FINANCE: ['VIEW_DASHBOARD', 'VIEW_BOOKINGS', 'VIEW_FINANCE', 'VIEW_REPORTS'],
    HR: ['VIEW_DASHBOARD', 'VIEW_CUSTOMERS', 'VIEW_USERS'],
    OPERATIONS: ['VIEW_DASHBOARD', 'VIEW_BOOKINGS', 'VIEW_TOURS', 'VIEW_INQUIRIES'],
};
