import process from "node:process";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const appStage = process.env.APP_STAGE ?? "dev";

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "production",
  appStage,
  bucketName: requireEnv("BUCKET_NAME"),
  awsRegion: process.env.AWS_S3_REGION ?? "us-east-1",
  isOffline: process.env.IS_OFFLINE === "true",
  chromiumBinPath: process.env.CHROMIUM_BIN_PATH,
  chromiumPackUrl: process.env.CHROMIUM_PACK_URL,
  isDev: appStage === "dev" || process.env.IS_OFFLINE === "true",
} as const;
