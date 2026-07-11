import { z } from 'zod';
import { USER_ROLES, PROGRAM_LEVELS, DURATION_UNITS, FEE_TYPES, PAYMENT_METHODS, BLOG_STATUS } from './constants';

// Authentication Schemas
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.enum([USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, 'super_admin', 'aspirant']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const UpdatePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Contact Form Schema
export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Program Schema
export const CreateProgramSchema = z.object({
  title: z.string().min(3, 'Program title is required'),
  slug: z.string().min(3, 'Program slug is required'),
  description: z.string().min(10, 'Description is required'),
  durationMonths: z.number().min(1, 'Duration must be at least 1'),
  durationUnit: z.enum([DURATION_UNITS.MONTHS, DURATION_UNITS.YEARS]),
  tuitionFee: z.number().min(0, 'Tuition fee must be positive'),
  curriculum: z.string().optional(),
  level: z.enum([PROGRAM_LEVELS.CERTIFICATE, PROGRAM_LEVELS.DIPLOMA, PROGRAM_LEVELS.DEGREE]),
  maxStudents: z.number().optional(),
});

export const UpdateProgramSchema = CreateProgramSchema.partial();

// Blog Post Schema
export const CreateBlogPostSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  slug: z.string().min(3, 'Slug is required'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().min(10, 'Excerpt is required').max(500, 'Excerpt too long'),
  featuredImageUrl: z.string().url('Invalid image URL').optional(),
  status: z.enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.ARCHIVED]).default(BLOG_STATUS.DRAFT),
});

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

// Event Schema
export const CreateEventSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().min(20, 'Description is required'),
  eventDate: z.string().datetime('Invalid date format'),
  location: z.string().min(3, 'Location is required'),
  featuredImageUrl: z.string().url('Invalid image URL').optional(),
  isPublished: z.boolean().default(false),
});

export const UpdateEventSchema = CreateEventSchema.partial();

// Fee Schema
export const CreateFeeSchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
  feeType: z.enum([FEE_TYPES.TUITION, FEE_TYPES.REGISTRATION, FEE_TYPES.EXAM, FEE_TYPES.LIBRARY, FEE_TYPES.OTHER]),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional(),
});

export const UpdateFeeSchema = CreateFeeSchema.partial();

// Payment Schema
export const InitiatePaymentSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMethod: z.enum([PAYMENT_METHODS.PAYSTACK, PAYMENT_METHODS.BANK_TRANSFER, PAYMENT_METHODS.CASH]).default(PAYMENT_METHODS.PAYSTACK),
  description: z.string().optional(),
});

// User Profile Schema
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name is required').optional(),
  lastName: z.string().min(2, 'Last name is required').optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Invalid image URL').optional(),
});

export const AdmissionDocumentTypeSchema = z.enum([
  'passport_photo',
  'signature',
  'birth_certificate',
  'age_declaration',
  'primary_certificate',
  'secondary_certificate',
  'indigene_certificate',
  'nin_slip',
  'jamb_result',
  'jamb_registration_form',
  'other',
])

export const UploadAdmissionDocumentSchema = z.object({
  documentType: AdmissionDocumentTypeSchema,
})

export const UploadPassportPhotoSchema = z.object({
  fileName: z.string().min(1),
})

// Admin User Management Schema
export const CreateAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.enum([USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN]),
  phone: z.string().optional(),
});

export const UpdateAdminUserSchema = CreateAdminUserSchema.partial();

// Type exports
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ContactFormInput = z.infer<typeof ContactFormSchema>;
export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
