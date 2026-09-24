import { spawnSync } from "node:child_process";

const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell: false });
  if (result.status !== 0) process.exit(result.status || 1);
};

const seedEnv = {
  ...process.env,
  DB_DRIVER: "postgres",
  ALLOW_PRODUCTION_SEED: "true",
  // Create/update the production administrator only when the project has
  // explicitly supplied both secret values. Fresh deployments without those
  // secrets still get the public catalogue and never create a weak default.
  SKIP_ADMIN_SEED: process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD ? "false" : "true",
};

run("npm", ["--prefix", "server", "run", "db:migrate:postgres"], seedEnv);
run("npm", ["--prefix", "server", "run", "seed"], seedEnv);
run("npm", ["--prefix", "client", "run", "build"], process.env);
