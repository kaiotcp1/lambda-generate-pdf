import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ZodError } from "zod";
import { GeneratePdfUseCase } from "../../app/use-cases/generate-pdf.use-case";
import { HttpError } from "../../app/errors/http.error";
import { PdfGenerationError } from "../../app/errors/pdf-generation.error";
import { GeneratePdfSchema } from "./schemas/generate-pdf.schema";
import { logger } from "../../utils/logger";

export class GeneratePdfController {
  constructor(private readonly useCase: GeneratePdfUseCase) {}

  async handle(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    try {
      if (!event.body) {
        throw HttpError.badRequest("Request body is required");
      }

      // Rejeita payloads acima de 32KB antes de parsear — impede Chromium de processar inputs gigantes
      if (Buffer.byteLength(event.body, "utf8") > 32 * 1024) {
        throw HttpError.badRequest("Request body too large");
      }

      let raw: unknown;
      try {
        raw = JSON.parse(event.body);
      } catch {
        throw HttpError.badRequest("Invalid JSON body");
      }

      const input = GeneratePdfSchema.parse(raw);

      const result = await this.useCase.execute(input);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return this.respond(HttpError.unprocessableEntity("Validation failed", details));
      }

      if (error instanceof HttpError) {
        return this.respond(error);
      }

      if (error instanceof PdfGenerationError) {
        logger.error({ error: error.message }, "PDF generation failed");
        return this.respond(HttpError.internal("Failed to generate PDF"));
      }

      throw error;
    }
  }

  private respond(error: HttpError): APIGatewayProxyResultV2 {
    return {
      statusCode: error.statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(error.toJSON()),
    };
  }
}
