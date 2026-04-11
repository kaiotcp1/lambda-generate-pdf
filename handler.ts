import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { makeGeneratePdfController } from "./src/factories/make-generate-pdf-controller";

// Controller instanciado fora do handler para reutilizar entre invocações (Lambda warm start)
const controller = makeGeneratePdfController();

export const generatePDF = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  // Permite retornar resposta sem aguardar o event loop esvaziar
  context.callbackWaitsForEmptyEventLoop = false;

  return controller.handle(event);
};