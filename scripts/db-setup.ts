import { existsSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const dbPath = resolve(rootDir, "dev.db");

function run(command: string, description: string) {
  console.log(`⏳ ${description}...`);
  try {
    execSync(command, { cwd: rootDir, stdio: "inherit" });
    console.log(`✓ ${description} complete`);
  } catch {
    console.error(`✗ ${description} failed`);
    process.exit(1);
  }
}

async function main() {
  if (existsSync(dbPath)) {
    console.log("✓ Database already exists, skipping setup");
    return;
  }

  console.log("🗄️  Setting up database...\n");

  run("bun run db:push", "Creating database schema");
  run("bun run db:seed", "Seeding database");

  console.log("\n🎉 Database setup complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
