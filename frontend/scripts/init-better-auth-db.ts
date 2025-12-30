/**
 * Initialize Better Auth database schema.
 *
 * This script creates the necessary tables for Better Auth session management.
 * Run with: npx tsx scripts/init-better-auth-db.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "better-auth.db");

console.log("Initializing Better Auth database...");
console.log(`Database path: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Create user table
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    image TEXT,
    twoFactorEnabled INTEGER NOT NULL DEFAULT 0
  );
`);

// Drop existing session table if it exists (to recreate with correct schema)
db.exec(`DROP TABLE IF EXISTS session;`);

// Create session table with all required columns
db.exec(`
  CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    activeOrganizationId TEXT,
    impersonatedBy TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );
`);

// Create account table (for OAuth providers, if needed in future)
db.exec(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt INTEGER,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );
`);

// Create verification table (for email verification, password reset)
db.exec(`
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER,
    updatedAt INTEGER
  );
`);

console.log("✅ Better Auth database initialized successfully!");
console.log("\nCreated tables:");
console.log("  - user");
console.log("  - session");
console.log("  - account");
console.log("  - verification");

db.close();
