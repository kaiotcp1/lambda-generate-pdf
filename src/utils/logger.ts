import pino from "pino";
import pretty from "pino-pretty";
import { config } from "../infra/config/env";

const loggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

export const logger = config.isDev
  ? pino(
      loggerOptions,
      // Avoid pino transport worker threads in bundled serverless-offline builds.
      pretty({ colorize: true, sync: true }),
    )
  : pino(loggerOptions);
