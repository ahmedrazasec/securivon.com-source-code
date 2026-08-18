import { z } from "zod";

/**
 * Validation schemas — the server-side validation boundary for every public
 * form. Client-side validation (in the eventual configurator/form UI) is a
 * UX convenience only; these schemas are the real boundary, per Phase 2
 * Corrections §6.
 *
 * Deliberately not marked server-only: these are safe (and useful) to import
 * from client components too, for matching client-side validation — they
 * contain no secrets or business logic, just shape/format rules.
 */

const pakistaniPhoneRegex = /^(\+92|0)?3\d{9}$/;

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const siteSurveyRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(pakistaniPhoneRegex, "Enter a valid Pakistani mobile number."),
  propertyType: z.string().trim().min(2).max(60),
  location: z.string().trim().min(2).max(160),
  preferredDateTime: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  configurationReference: z.string().trim().max(120).optional(),
});

export const requestQuoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(pakistaniPhoneRegex, "Enter a valid Pakistani mobile number."),
  email: z.string().trim().email().optional().or(z.literal("")),
  propertyType: z.string().trim().min(2).max(60),
  location: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const configuratorAnswersSchema = z.object({
  propertyType: z.enum(["house", "apartment", "shop", "office", "restaurant", "warehouse", "other"]),
  cameraCount: z.number().int().min(1).max(64),
  coverageTierId: z.string().min(1),
  storageTierId: z.enum(["2w", "4w", "1m"]),
  addonIds: z.array(z.string()).max(10),
  floors: z.number().int().min(1).max(20),
  cableDistanceCategory: z.enum(["short", "medium", "long"]),
  difficultAccess: z.boolean(),
  needsConduitTrunking: z.boolean(),
  isNewCabling: z.boolean(),
  wantsRemoteViewSetup: z.boolean(),
  hasInternet: z.boolean(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SiteSurveyRequestInput = z.infer<typeof siteSurveyRequestSchema>;
export type RequestQuoteInput = z.infer<typeof requestQuoteSchema>;
export type ConfiguratorAnswersInput = z.infer<typeof configuratorAnswersSchema>;
