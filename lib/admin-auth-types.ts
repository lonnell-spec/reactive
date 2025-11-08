'use client'

import { z } from 'zod'

// Registration form schema
export const registrationFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  phone: z.string()
    .transform(val => val.replace(/\D/g, '')) // Strip all non-digits
    .refine(val => val.length === 10, 'Phone number must be exactly 10 digits'),
  adminCode: z.string()
    .min(1, 'Registration code is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Login form schema
export const loginFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
})

// Forgot password form schema
export const forgotPasswordFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
})

// TypeScript types derived from schemas
export type RegistrationFormData = z.infer<typeof registrationFormSchema>
export type LoginFormData = z.infer<typeof loginFormSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>
