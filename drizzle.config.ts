import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/persistence/drizzle/schema.ts",
  out: "./src/persistence/drizzle/migrations",
});
