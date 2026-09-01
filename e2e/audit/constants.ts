import * as path from "node:path";

/** Saved session for the audit's authed routes (regenerated every run). */
export const AUTH_STATE = path.resolve(__dirname, "..", ".auth", "audit-user.json");

/** Raw screenshots land here, split by target: audit-output/app | mocks. */
export const AUDIT_OUTPUT_DIR = path.resolve(__dirname, "..", "audit-output");

/** Seeded by `saturdaze seed` (Saturdaze.Cli UserSeeder). */
export const AUDIT_USER = {
  email: "quinntynebrown@gmail.com",
  password: "password123",
} as const;
