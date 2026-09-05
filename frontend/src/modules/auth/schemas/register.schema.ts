import { z } from 'zod';

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Ingresa un correo válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
