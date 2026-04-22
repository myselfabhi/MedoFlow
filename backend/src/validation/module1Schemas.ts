import { z } from 'zod'

const cuidSchema = z.string().min(1, 'ID is required')

const emailSchema = z
  .string()
  .trim()
  .email('Valid email is required')
  .transform((value) => value.toLowerCase())

const optionalPriceOverride = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }
  return value
}, z.coerce.number().min(0, 'Price override must be 0 or greater').optional())

export const patientRegistrationSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
}

export const clinicSetupSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Clinic name is required'),
    email: emailSchema,
    location: z.object({
      id: cuidSchema.optional(),
      name: z.string().trim().min(1, 'Location name is required'),
      address: z.string().trim().optional(),
      timezone: z.string().trim().min(1, 'Timezone is required'),
    }),
  }),
}

export const clinicUpdateSchema = {
  body: z
    .object({
      name: z.string().trim().min(1, 'Clinic name is required').optional(),
      email: emailSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided',
    }),
}

export const locationUpsertSchema = {
  body: z.object({
    id: cuidSchema.optional(),
    name: z.string().trim().min(1, 'Location name is required'),
    address: z.string().trim().optional(),
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    timezone: z.string().trim().min(1, 'Timezone is required'),
  }),
}

export const disciplineCreateSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
  }),
}

export const disciplineUpdateSchema = {
  params: z.object({
    id: cuidSchema,
  }),
  body: z
    .object({
      name: z.string().trim().min(1, 'Name is required').optional(),
      description: z.string().trim().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided',
    }),
}

export const serviceCreateSchema = {
  body: z.object({
    disciplineId: cuidSchema,
    name: z.string().trim().min(1, 'Name is required'),
    duration: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
    defaultPrice: z.coerce.number().min(0, 'Default price must be 0 or greater'),
    taxApplicable: z.boolean().optional(),
  }),
}

export const serviceUpdateSchema = {
  params: z.object({
    id: cuidSchema,
  }),
  body: z
    .object({
      disciplineId: cuidSchema.optional(),
      name: z.string().trim().min(1, 'Name is required').optional(),
      duration: z.coerce.number().int().min(1, 'Duration must be at least 1 minute').optional(),
      defaultPrice: z.coerce.number().min(0, 'Default price must be 0 or greater').optional(),
      taxApplicable: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided',
    }),
}

export const providerCreateSchema = {
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: emailSchema,
    phone: z.string().trim().optional(),
    disciplineIds: z.array(cuidSchema).min(1, 'At least one discipline is required'),
    locationIds: z.array(cuidSchema).optional(),
    services: z
      .array(
        z.object({
          serviceId: cuidSchema,
          priceOverride: optionalPriceOverride,
        })
      )
      .min(1, 'At least one service is required'),
  }),
}

export const providerUpdateSchema = {
  params: z.object({
    id: cuidSchema,
  }),
  body: z
    .object({
      firstName: z.string().trim().min(1, 'First name is required').optional(),
      lastName: z.string().trim().min(1, 'Last name is required').optional(),
      email: emailSchema.optional(),
      phone: z.string().trim().optional(),
      disciplineIds: z.array(cuidSchema).min(1).optional(),
      locationIds: z.array(cuidSchema).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided',
    }),
}

export const providerServiceCreateSchema = {
  params: z.object({
    id: cuidSchema,
  }),
  body: z.object({
    serviceId: cuidSchema,
    priceOverride: optionalPriceOverride,
  }),
}

export const providerServiceUpdateSchema = {
  params: z.object({
    id: cuidSchema,
    serviceId: cuidSchema,
  }),
  body: z.object({
    priceOverride: optionalPriceOverride,
  }),
}

export const frontDeskProvisionSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: emailSchema,
  }),
}
