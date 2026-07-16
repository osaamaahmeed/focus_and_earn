import fs from "node:fs";
import path from "node:path";

const clientDir = path.join(process.cwd(), "dist", "client");
const shellPath = path.join(clientDir, "_shell.html");
const indexPath = path.join(clientDir, "index.html");
const errorPath = path.join(clientDir, "404.html");

if (fs.existsSync(shellPath)) {
  fs.copyFileSync(shellPath, indexPath);
  console.log("Successfully copied _shell.html to index.html");
  fs.copyFileSync(shellPath, errorPath);
  console.log("Successfully copied _shell.html to 404.html");
} else {
  console.error("Error: _shell.html not found in dist/client");
  process.exit(1);
}
