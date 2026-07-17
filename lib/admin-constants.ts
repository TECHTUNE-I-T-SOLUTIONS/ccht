// Admin Departments
export const ADMIN_DEPARTMENTS = [
  { value: 'administration', label: 'Administration' },
  { value: 'academic_affairs', label: 'Academic Affairs' },
  { value: 'student_affairs', label: 'Student Affairs' },
  { value: 'finance', label: 'Finance' },
  { value: 'registry', label: 'Registry' },
  { value: 'library', label: 'Library' },
  { value: 'health_services', label: 'Health Services' },
  { value: 'security', label: 'Security' },
  { value: 'ict', label: 'ICT' },
  { value: 'works_and_maintenance', label: 'Works and Maintenance' },
  { value: 'quality_assurance', label: 'Quality Assurance' },
  { value: 'research', label: 'Research' },
  { value: 'community_services', label: 'Community Services' },
  { value: 'other', label: 'Other' },
] as const;

export type AdminDepartment = typeof ADMIN_DEPARTMENTS[number]['value'];

// Admin Designations
export const ADMIN_DESIGNATIONS = [
  { value: 'provost', label: 'Provost' },
  { value: 'deputy_provost', label: 'Deputy Provost' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'dean', label: 'Dean' },
  { value: 'head_of_department', label: 'Head of Department' },
  { value: 'director', label: 'Director' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'senior_lecturer', label: 'Senior Lecturer' },
  { value: 'principal_lecturer', label: 'Principal Lecturer' },
  { value: 'assistant_lecturer', label: 'Assistant Lecturer' },
  { value: 'administrative_officer', label: 'Administrative Officer' },
  { value: 'executive_officer', label: 'Executive Officer' },
  { value: 'clerk', label: 'Clerk' },
  { value: 'technician', label: 'Technician' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'security_officer', label: 'Security Officer' },
  { value: 'it_officer', label: 'IT Officer' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'other', label: 'Other' },
] as const;

export type AdminDesignation = typeof ADMIN_DESIGNATIONS[number]['value'];

// Admin Scopes
export const ADMIN_SCOPES = [
  { value: 'operations', label: 'Operations' },
  { value: 'academics', label: 'Academics' },
  { value: 'finance', label: 'Finance' },
  { value: 'super', label: 'Super Admin' },
] as const;

export type AdminScope = typeof ADMIN_SCOPES[number]['value'];

// Admin Permissions
export const ADMIN_PERMISSIONS = [
  { key: 'can_manage_users', label: 'Manage Users', description: 'Can create, edit, and delete user accounts' },
  { key: 'can_manage_content', label: 'Manage Content', description: 'Can manage blog posts, events, and notices' },
  { key: 'can_manage_academics', label: 'Manage Academics', description: 'Can manage courses, assessments, and results' },
  { key: 'can_manage_finance', label: 'Manage Finance', description: 'Can manage fees, invoices, and payments' },
] as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[number]['key'];

// Helper functions
export const getDepartmentLabel = (value: string): string => {
  const dept = ADMIN_DEPARTMENTS.find(d => d.value === value);
  return dept?.label || value;
};

export const getDesignationLabel = (value: string): string => {
  const designation = ADMIN_DESIGNATIONS.find(d => d.value === value);
  return designation?.label || value;
};

export const getScopeLabel = (value: string): string => {
  const scope = ADMIN_SCOPES.find(s => s.value === value);
  return scope?.label || value;
};

// Staff ID prefix
export const STAFF_ID_PREFIX = 'CCHT/ADMIN/';
