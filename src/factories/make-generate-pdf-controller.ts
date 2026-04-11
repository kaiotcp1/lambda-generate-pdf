
import { GeneratePdfController } from "../infra/http/generate-pdf.controller";
import { GeneratePdfUseCase } from "../app/use-cases/generate-pdf.use-case";
import { HtmlBuilderService } from "../app/services/html-builder.service";
import { PdfBuilderService } from "../app/services/pdf-builder.service";
import { S3Adapter } from "../infra/cloud/s3.adapter";

// Factory: centraliza criação e wiring de todas as dependências
// Uma função simples é mais legível e transparente do que um framework de DI
export function makeGeneratePdfController(): GeneratePdfController {
  const htmlBuilder = new HtmlBuilderService();
  const pdfBuilder = new PdfBuilderService();
  const s3Adapter = new S3Adapter();
  const useCase = new GeneratePdfUseCase(htmlBuilder, pdfBuilder, s3Adapter);
  return new GeneratePdfController(useCase);
}