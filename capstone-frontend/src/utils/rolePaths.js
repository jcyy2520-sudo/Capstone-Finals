const ROLE_BASE_PATHS = {
  system_admin: '/admin',
  hope: '/hope',
  bac_chairperson: '/chairperson',
  bac_secretariat: '/secretariat',
  bac_member: '/bac-member',
  twg_member: '/twg',
  department_requester: '/requester',
  budget_officer: '/budget',
  finance_officer: '/finance',
  vendor: '/vendor',
  observer: '/observer',
  internal_auditor: '/auditor',
};

export function getRoleBasePath(roleName) {
  return ROLE_BASE_PATHS[roleName] || null;
}

export function getRoleDashboardPath(roleName) {
  const basePath = getRoleBasePath(roleName);
  return basePath ? `${basePath}/dashboard` : '/login';
}

export function resolveRoleRedirectPath(candidatePath, roleName) {
  if (!candidatePath || candidatePath === '/dashboard') {
    return getRoleDashboardPath(roleName);
  }

  return candidatePath;
}