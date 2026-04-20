import { readFile } from "node:fs/promises";
import path from "node:path";

const DESTRUCTIVE_PATTERN = /\b(DROP|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE\s+.*\bDROP\b)\b/i;

export function splitSqlStatements(schema: string): string[] {
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

export function assertNonDestructiveStatements(statements: string[]): void {
  for (const statement of statements) {
    if (DESTRUCTIVE_PATTERN.test(statement)) {
      throw new Error(
        `Destructive SQL is not allowed in live schema migrations: ${statement.slice(0, 120)}`,
      );
    }
  }
}

export async function readLiveSchemaStatements(): Promise<string[]> {
  const schemaPath = path.join(process.cwd(), "src/lib/live/db/schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  const statements = splitSqlStatements(schema);
  assertNonDestructiveStatements(statements);
  return statements;
}
