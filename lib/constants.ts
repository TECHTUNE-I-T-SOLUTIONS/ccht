// School Information
export const SCHOOL_INFO = {
  name: 'Covenant College of Health Technology',
  fullname: 'Covenant College of Health Technology, Igbon, Oyo State',
  shortName: 'CCHT',
  email: 'info@covenantcollegeofhealthtech.com.ng',
  provostEmail: 'provost@covenantcollegeofhealthtech.com.ng',
  phone: '+234 7066 3698 18',
  address: 'Igbon, Oyo, Nigeria',
  tagline: 'Quality education for health-filled society',
};

// Routes
export const ROUTES = {
  home: '/',
  about: '/about',
  faq: '/faq',
  programs: '/programs',
  blog: '/blog',
  events: '/events',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  portal: '/portal',
  studentDashboard: '/portal/student/dashboard',
  teacherDashboard: '/portal/teacher/dashboard',
  lecturerDashboard: '/portal/teacher/dashboard',
  adminDashboard: '/portal/admin/dashboard',
};

// User Roles
export type UserRole = 'student' | 'lecturer' | 'admin';

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'lecturer',
  LECTURER: 'lecturer',
  ADMIN: 'admin',
} as const;

// Program Levels
export const PROGRAM_LEVELS = {
  CERTIFICATE: 'certificate',
  DIPLOMA: 'diploma',
  DEGREE: 'degree',
} as const;

// Program Durations
export const DURATION_UNITS = {
  MONTHS: 'months',
  YEARS: 'years',
} as const;

// Fee Types
export const FEE_TYPES = {
  TUITION: 'tuition',
  REGISTRATION: 'registration',
  EXAM: 'exam',
  LIBRARY: 'library',
  OTHER: 'other',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  PAYSTACK: 'paystack',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
} as const;

// Blog Status
export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Enrollment Status
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  BLOG_PAGE_SIZE: 12,
  PROGRAMS_PAGE_SIZE: 9,
};

// Paystack Config
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  API_BASE_URL: 'https://api.paystack.co',
};

// API Endpoints
export const API_ENDPOINTS = {
  programs: '/api/v1/programs',
  blog: '/api/v1/blog',
  events: '/api/v1/events',
  auth: '/api/v1/auth',
  contact: '/api/v1/contact',
  payments: '/api/v1/payments',
  users: '/api/v1/users',
};
