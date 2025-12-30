/**
 * Verify Better Auth database schema.
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "better-auth.db");
const db = new Database(DB_PATH);

console.log("Verifying Better Auth database schema...\n");

// Get session table schema
const sessionInfo = db.pragma("table_info(session)") as Array<{ name: string; type: string }>;
console.log("Session table columns:");
sessionInfo.forEach((col) => {
  console.log(`  - ${col.name} (${col.type})`);
});

// Check if token column exists
const hasToken = sessionInfo.some((col) => col.name === "token");
if (hasToken) {
  console.log("\n✅ Session table has 'token' column");
} else {
  console.log("\n❌ Session table is missing 'token' column");
}

db.close();
