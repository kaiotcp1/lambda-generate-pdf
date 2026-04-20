import { z } from "zod";

const PdfItemSchema = z.object({
  description: z.string().min(1, "Item description is required").max(200),
  quantity: z.number().int().positive("Item quantity must be a positive integer").max(9999),
  unit: z.string().min(1, "Item unit is required").max(20),
});

export const GeneratePdfSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  recipientName: z.string().min(1, "recipientName is required").max(200),
  recipientDocument: z.string().min(1, "recipientDocument is required").max(50),
  deliveryDate: z.string().min(1, "deliveryDate is required").max(30),
  items: z.array(PdfItemSchema).min(1, "At least one item is required").max(50, "Too many items"),
  notes: z.string().max(1000).optional(),
});

export type GeneratePdfSchemaInput = z.infer<typeof GeneratePdfSchema>;
