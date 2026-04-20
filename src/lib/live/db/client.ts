import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }
  return databaseUrl;
}

const sql = neon(getDatabaseUrl());

export { sql };
