/**
 * The signed-in user.
 *
 * Hard-coded until Authentication (PRD 21) lands. Everything that needs "who
 * am I" reads this one constant, so there is a single place to replace when a
 * real session exists — rather than a scattering of literals in components.
 */
export const CURRENT_USER_ID = 'EMP-1001';
