import { z } from "zod";

const PdfItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().positive("Item quantity must be a positive integer"),
  unit: z.string().min(1, "Item unit is required"),
});

export const GeneratePdfSchema = z.object({
  title: z.string().min(1, "title is required"),
  recipientName: z.string().min(1, "recipientName is required"),
  recipientDocument: z.string().min(1, "recipientDocument is required"),
  deliveryDate: z.string().min(1, "deliveryDate is required"),
  items: z.array(PdfItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

export type GeneratePdfSchemaInput = z.infer<typeof GeneratePdfSchema>;
