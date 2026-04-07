const net = require("net");
const { spawn } = require("child_process");

function normalizeBooleanEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== "string") {
    return;
  }

  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    delete process.env[name];
    return;
  }

  if (["true", "false", "1", "0"].includes(trimmed)) {
    process.env[name] = trimmed;
    return;
  }

  delete process.env[name];
}

function hasArg(args, name) {
  return args.includes(name);
}

function getArgValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.on("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function resolvePort(args) {
  const explicitPort = getArgValue(args, "--port");
  if (explicitPort) {
    return { port: Number(explicitPort), args };
  }

  const preferredPorts = [8081, 8082, 8089, 8115];
  for (const port of preferredPorts) {
    if (await canListen(port)) {
      return { port, args: [...args, "--port", String(port)] };
    }
  }

  let port = 8090;
  while (!(await canListen(port))) {
    port += 1;
  }

  return { port, args: [...args, "--port", String(port)] };
}

async function main() {
  normalizeBooleanEnv("CI");
  process.env.CI = "false";

  const forwardedArgs = process.argv.slice(2);
  const commandArgs = hasArg(forwardedArgs, "start")
    ? forwardedArgs
    : ["start", ...forwardedArgs];

  const { port, args } = await resolvePort(commandArgs);
  console.log(`[start-expo] using port ${port}`);

  const cliPath = require.resolve("expo/bin/cli", { paths: [process.cwd()] });
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
