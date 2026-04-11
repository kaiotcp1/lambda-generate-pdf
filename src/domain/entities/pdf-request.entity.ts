export interface PdfRequestEntity {
  title: string;
  recipientName: string;
  recipientDocument: string;
  deliveryDate: string;
  items: PdfItem[];
  notes?: string;
}

export interface PdfItem {
  description: string;
  quantity: number;
  unit: string;
}