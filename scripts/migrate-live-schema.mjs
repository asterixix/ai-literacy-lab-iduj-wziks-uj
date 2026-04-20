import { readFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";

const DESTRUCTIVE_PATTERN = /\b(DROP|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE\s+.*\bDROP\b)\b/i;

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");
      const key = trimmedLine.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) {
        continue;
      }

      let value = trimmedLine.slice(separatorIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // Ignore missing env files; the process env may already be populated.
  }
}

const root = process.cwd();
await loadEnvFile(path.join(root, ".env.local"));
await loadEnvFile(path.join(root, ".env"));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing.");
}

const pool = new Pool({ connectionString: databaseUrl });

function splitSqlStatements(schema) {
  const compactSchema = schema
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine.length > 0 && !trimmedLine.startsWith("--");
    })
    .join("\n");

  return compactSchema
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function assertNonDestructiveStatements(statements) {
  for (const statement of statements) {
    if (DESTRUCTIVE_PATTERN.test(statement)) {
      throw new Error(`Destructive SQL is not allowed in live schema migrations: ${statement.slice(0, 120)}`);
    }
  }
}

const schemaPath = path.join(process.cwd(), "src/lib/live/db/schema.sql");
const schema = await readFile(schemaPath, "utf8");
const statements = splitSqlStatements(schema);
assertNonDestructiveStatements(statements);

for (const statement of statements) {
  await pool.query(statement);
}

const checkResult = await pool.query("SELECT to_regclass('public.workshops') AS regclass;");
await pool.end();

if (!checkResult.rows[0]?.regclass) {
  throw new Error("Live schema migration completed but workshops table is still missing.");
}

console.log(`Applied ${statements.length} live schema statements.`);