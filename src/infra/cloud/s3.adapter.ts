import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PdfGenerationError } from "../../app/errors/pdf-generation.error";
import { logger } from "../../utils/logger";
import { config } from "../config/env";

export class S3Adapter {
  private readonly client = new S3Client({ region: config.awsRegion });

  async uploadPdf(key: string, buffer: Buffer): Promise<string> {
    logger.info({ key, bucket: config.bucketName, region: config.awsRegion }, "Uploading PDF to S3");

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: key,
          Body: buffer,
          ContentType: "application/pdf",
        }),
      );

      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
        { expiresIn: 3600 },
      );

      logger.info({ key }, "PDF uploaded, pre-signed URL generated");
      return url;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "PermanentRedirect"
      ) {
        const endpoint =
          "Endpoint" in error && typeof error.Endpoint === "string" ? error.Endpoint : "unknown";

        throw new PdfGenerationError(
          `S3 bucket region mismatch for "${config.bucketName}". Configure AWS_S3_REGION to match the real bucket region. Expected endpoint: ${endpoint}.`,
          error,
        );
      }

      throw error;
    }
  }
}
