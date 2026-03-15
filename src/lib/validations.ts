import { z } from "zod/v4";

// ─── Shared field validators ───

const emailField = z.email("Please enter a valid email address");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const nameField = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes")
  .optional();

// ─── Registration Schema ───

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Server-side Registration (no confirmPassword) ───

export const registerServerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export type RegisterServerInput = z.infer<typeof registerServerSchema>;

// ─── Login Schema ───

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Password Reset Request ───

export const resetPasswordRequestSchema = z.object({
  email: emailField,
});

// ─── Password Reset Confirm ───

export const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Profile Update ───

export const profileUpdateSchema = z.object({
  name: nameField,
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  image: z
    .string()
    .max(2048, "Image URL too long")
    .optional()
    .or(z.literal(""))
    .or(z.literal(null as unknown as string)),
  bannerImage: z
    .string()
    .max(2048, "Banner URL too long")
    .optional()
    .or(z.literal(""))
    .or(z.literal(null as unknown as string)),
  notifyComments: z.boolean().optional(),
  notifyNewPosts: z.boolean().optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordField.optional().or(z.literal("")),
});

// ─── Helper: format Zod errors into a single user-friendly string ───

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}

// ─── Helper: format Zod errors into a field-level map ───

export function formatZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
