import { spawnSync } from "node:child_process";

const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell: false });
  if (result.status !== 0) process.exit(result.status || 1);
};

const seedEnv = {
  ...process.env,
  DB_DRIVER: "postgres",
  ALLOW_PRODUCTION_SEED: "true",
  SKIP_ADMIN_SEED: "true",
};

run("npm", ["--prefix", "server", "run", "db:migrate:postgres"], seedEnv);
run("npm", ["--prefix", "server", "run", "seed"], seedEnv);
run("npm", ["--prefix", "client", "run", "build"], process.env);

