import { createServer } from "http";
import net from "net";
import { runMigrations } from "./migrate";
import { runEnvBootstrap } from "./bootstrap";
import { registerRoutes } from "./routes";
import { setupWebSocket } from "./websocket";
import { serveStatic } from "./static";
import express, { type Request, Response, NextFunction } from "express";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/* -----------------------------------------------------------------------
 * In-process TCP proxy with header sanitiser
 *
 * Node.js's llhttp HTTP parser (v20+) unconditionally rejects header names
 * that contain whitespace (e.g. "Charse t: UTF-8") with a raw 400 before
 * Express ever sees the request.  The `--insecure-http-parser` flag and
 * the `insecureHTTPParser` server option do NOT relax this rule in Node 20.
 *
 * Solution: bind the real HTTP server on a loopback port (INTERNAL_PORT)
 * and put a lightweight net.Server TCP proxy on the external port.  The
 * proxy buffers each connection's incoming bytes until it has a complete
 * HTTP header block, strips any header line whose name contains whitespace,
 * then forwards the cleaned bytes to the internal server.  After the header
 * block, subsequent bytes (request body, keep-alive requests, WebSocket
 * frames) are piped through unchanged.
 * ----------------------------------------------------------------------- */

// Any available loopback port.  We pick a fixed high number so it doesn't
// collide with well-known ports used by Vite HMR or other tooling.
const INTERNAL_PORT = 15237;

function stripBadHeaders(raw: Buffer): Buffer {
  const sep = raw.indexOf("\r\n\r\n");
  if (sep === -1) return raw; // shouldn't happen — caller checks first

  const headerSection = raw.slice(0, sep).toString("latin1");
  const body = raw.slice(sep + 4);

  const cleaned = headerSection
    .split("\r\n")
    .filter((line, idx) => {
      if (idx === 0) return true; // keep the request line
      const colon = line.indexOf(":");
      if (colon < 0) return false;
      return !/[\t ]/.test(line.slice(0, colon)); // drop if header name has ws
    })
    .join("\r\n");

  return Buffer.concat([Buffer.from(cleaned + "\r\n\r\n", "latin1"), body]);
}

function createHeaderProxy(externalPort: number): net.Server {
  const proxy = net.createServer((client) => {
    let buf = Buffer.alloc(0);
    let headersDone = false;

    const backend = net.connect(INTERNAL_PORT, "127.0.0.1");

    client.on("data", (chunk: Buffer) => {
      if (headersDone) {
        backend.write(chunk);
        return;
      }

      buf = Buffer.concat([buf, chunk]);

      const sep = buf.indexOf("\r\n\r\n");
      if (sep === -1) return; // Accumulate until the full header block arrives

      headersDone = true;
      const cleaned = stripBadHeaders(buf);
      buf = Buffer.alloc(0);
      backend.write(cleaned);
    });

    backend.on("data", (d: Buffer) => client.write(d));

    client.on("end", () => backend.end());
    backend.on("end", () => client.end());

    function cleanup() {
      client.destroy();
      backend.destroy();
    }
    client.on("error", cleanup);
    backend.on("error", cleanup);
    client.on("close", () => backend.destroy());
    backend.on("close", () => client.destroy());
  });

  proxy.listen({ port: externalPort, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${externalPort}`);
  });

  return proxy;
}

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err && (err.type === "entity.parse.failed" || err.status === 400)) {
    return res.status(400).json({ status: false, reason: "INVALID REQUEST BODY" });
  }
  next(err);
});

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await runMigrations();
  await runEnvBootstrap();
  const sessionMiddleware = await registerRoutes(httpServer, app);

  setupWebSocket(httpServer, sessionMiddleware);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const externalPort = parseInt(process.env.PORT || "5000", 10);

  // Bind HTTP server on loopback only; the proxy listens on all interfaces
  httpServer.listen({ port: INTERNAL_PORT, host: "127.0.0.1" }, () => {
    log(`internal HTTP ready on ${INTERNAL_PORT}`);
    createHeaderProxy(externalPort);
  });
})();
