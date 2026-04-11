import * as fs from "fs";
import * as path from "path";
import { PdfRequestEntity } from "../../domain/entities/pdf-request.entity";

export class HtmlBuilderService {
  private readonly templatePath = this.resolveTemplatePath();

  private resolveTemplatePath(): string {
    const candidates = [
      path.resolve(process.cwd(), "src", "utils", "template.html"),
      path.resolve(process.cwd(), "utils", "template.html"),
      path.resolve(__dirname, "../../utils/template.html"),
    ];

    const templatePath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!templatePath) {
      throw new Error(`Template file not found. Tried: ${candidates.join(", ")}`);
    }

    return templatePath;
  }

  build(data: PdfRequestEntity): string {
    let html = fs.readFileSync(this.templatePath, "utf-8");

    const replacements: Record<string, string> = {
      "{{title}}": data.title,
      "{{recipient_name}}": data.recipientName,
      "{{recipient_document}}": data.recipientDocument,
      "{{delivery_date}}": data.deliveryDate,
      "{{notes}}": data.notes ?? "",
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      html = html.split(placeholder).join(value);
    }

    const itemRows = data.items
      .map(
        (item) =>
          `<tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
          </tr>`,
      )
      .join("");

    return html.split("{{items}}").join(itemRows);
  }
}
