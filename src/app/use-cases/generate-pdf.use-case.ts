import { randomUUID } from "crypto";
import { GeneratePdfInput } from "../dtos/generate-pdf.input";
import { GeneratePdfOutput } from "../dtos/generate-pdf.output";
import { HtmlBuilderService } from "../services/html-builder.service";
import { PdfBuilderService } from "../services/pdf-builder.service";
import { S3Adapter } from "../../infra/cloud/s3.adapter";
import { PdfGenerationError } from "../errors/pdf-generation.error";
import { logger } from "../../utils/logger";

export class GeneratePdfUseCase {
  constructor(
    private readonly htmlBuilder: HtmlBuilderService,
    private readonly pdfBuilder: PdfBuilderService,
    private readonly s3Adapter: S3Adapter
  ) { }

  async execute(input: GeneratePdfInput): Promise<GeneratePdfOutput> {
    logger.info({ title: input.title }, "Starting PDF generation");

    try {
      const html = this.htmlBuilder.build(input);
      const pdfBuffer = await this.pdfBuilder.buildFromHtml(html);
      const url = await this.s3Adapter.uploadPdf(`pdfs/${randomUUID()}.pdf`, pdfBuffer);

      return {
        url,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
    } catch (error) {
      logger.error({ error }, "Failed to generate PDF");
      throw new PdfGenerationError("Failed to generate PDF", error);
    }
  }
}