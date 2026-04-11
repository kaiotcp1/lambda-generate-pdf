import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { logger } from "../../utils/logger";
import { config } from "../../infra/config/env";

export class PdfBuilderService {
  async buildFromHtml(html: string): Promise<Buffer> {
    logger.info("Launching Chromium for PDF generation");

    const browser = config.isOffline
      ? await puppeteer.launch({
          executablePath:
            config.chromiumBinPath ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
          headless: true,
          args: puppeteer.defaultArgs(),
        })
      : await puppeteer.launch({
          args: puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
          executablePath: await chromium.executablePath(config.chromiumPackUrl),
          headless: "shell",
        });

    try {
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.evaluateHandle("document.fonts.ready");

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      });

      logger.info("PDF generated successfully");
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
